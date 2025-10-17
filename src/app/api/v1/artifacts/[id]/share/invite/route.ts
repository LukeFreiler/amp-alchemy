/**
 * Share Link Email Invitation API Route
 *
 * POST /api/v1/artifacts/[id]/share/invite - Send share link via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, AuthorizationError, ValidationError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { sendArtifactShareEmail } from '@/lib/email';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ShareLinkDetails = {
  id: string;
  token: string;
  artifact_title: string;
  company_id: string;
};

/**
 * POST /api/v1/artifacts/[id]/share/invite
 *
 * Send a share link via email
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Parse request body
    const body = await request.json();
    const { email, share_link_id } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      throw new ValidationError('Invalid email format');
    }

    // Validate share_link_id
    if (!share_link_id || typeof share_link_id !== 'string') {
      throw new ValidationError('share_link_id is required');
    }

    // Fetch share link and verify it belongs to this artifact and company
    const shareLink = await queryOne<ShareLinkDetails>(
      `SELECT
        sl.id,
        sl.token,
        a.title as artifact_title,
        sess.company_id
       FROM share_links sl
       JOIN artifacts a ON a.id = sl.artifact_id
       JOIN sessions sess ON sess.id = a.session_id
       WHERE sl.id = $1 AND a.id = $2`,
      [share_link_id, id]
    );

    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    // Verify user has access
    if (shareLink.company_id !== user.company_id) {
      throw new AuthorizationError('You do not have permission to share this artifact');
    }

    // Build share URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${appUrl}/share/${shareLink.token}`;

    // Send email via shared email function
    const emailSent = await sendArtifactShareEmail({
      to: email.trim().toLowerCase(),
      sharerName: user.name,
      artifactTitle: shareLink.artifact_title,
      shareUrl,
    });

    if (!emailSent) {
      throw new Error('Failed to send email');
    }

    logger.info('Sent share link email', {
      artifact_id: id,
      share_link_id: shareLink.id,
      recipient: email.trim().toLowerCase(),
      company_id: user.company_id,
      user_id: user.id,
    });

    return NextResponse.json<SuccessResponse<{ sent: boolean }>>({
      ok: true,
      data: { sent: true },
    });
  } catch (error) {
    return handleError(error);
  }
}
