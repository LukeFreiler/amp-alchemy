/**
 * Share Link Creation API Route
 *
 * POST /api/v1/artifacts/[id]/share - Create share link for artifact
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireAuth } from '@/lib/auth/middleware';
import {
  handleError,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type Artifact = {
  id: string;
  session_id: string;
  company_id: string;
  published: boolean;
};

type ShareLink = {
  id: string;
  artifact_id: string;
  token: string;
  allow_source_upload: boolean;
  expires_at: Date | null;
  created_by: string;
  created_at: Date;
};

type ShareLinkWithUrl = ShareLink & {
  url: string;
};

/**
 * POST /api/v1/artifacts/[id]/share
 *
 * Create a share link for an artifact
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Parse request body
    const body = await request.json();
    const { expires_in_days, allow_source_upload } = body;

    // Validate expires_in_days if provided
    if (
      expires_in_days !== null &&
      expires_in_days !== undefined &&
      (typeof expires_in_days !== 'number' || expires_in_days < 1)
    ) {
      throw new ValidationError('expires_in_days must be a positive number');
    }

    // Fetch artifact to verify ownership and published status
    const artifact = await queryOne<Artifact>(
      `SELECT a.id, a.session_id, s.company_id, a.published
       FROM artifacts a
       JOIN sessions s ON s.id = a.session_id
       WHERE a.id = $1`,
      [id]
    );

    if (!artifact) {
      throw new NotFoundError('Artifact not found');
    }

    // Verify user has access
    if (artifact.company_id !== user.company_id) {
      throw new AuthorizationError(
        'You do not have permission to share this artifact'
      );
    }

    // Verify artifact is published
    if (!artifact.published) {
      throw new ValidationError('Artifact must be published before sharing');
    }

    // Generate secure random token (64 characters)
    const token = randomBytes(32).toString('hex');

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }

    // Create share link
    const shareLink = await queryOne<ShareLink>(
      `INSERT INTO share_links (artifact_id, token, allow_source_upload, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, token, allow_source_upload || false, expiresAt, user.id]
    );

    if (!shareLink) {
      throw new Error('Failed to create share link');
    }

    // Build full URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareLinkWithUrl: ShareLinkWithUrl = {
      ...shareLink,
      url: `${appUrl}/share/${token}`,
    };

    logger.info('Created share link', {
      artifact_id: id,
      share_link_id: shareLink.id,
      token_length: token.length,
      expires_at: expiresAt,
      allow_source_upload: allow_source_upload || false,
      company_id: user.company_id,
      user_id: user.id,
    });

    return NextResponse.json<SuccessResponse<ShareLinkWithUrl>>(
      {
        ok: true,
        data: shareLinkWithUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
