/**
 * Share Link Delete API Route
 *
 * DELETE /api/v1/share-links/[id] - Revoke share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, AuthorizationError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ShareLink = {
  id: string;
  artifact_id: string;
  company_id: string;
};

/**
 * DELETE /api/v1/share-links/[id]
 *
 * Revoke a share link (deletes the record)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Fetch share link to verify ownership
    const shareLink = await queryOne<ShareLink>(
      `SELECT
        sl.id,
        sl.artifact_id,
        sess.company_id
       FROM share_links sl
       JOIN artifacts a ON a.id = sl.artifact_id
       JOIN sessions sess ON sess.id = a.session_id
       WHERE sl.id = $1`,
      [id]
    );

    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    // Verify user has access
    if (shareLink.company_id !== user.company_id) {
      throw new AuthorizationError('You do not have permission to revoke this share link');
    }

    // Delete share link
    await execute('DELETE FROM share_links WHERE id = $1', [id]);

    logger.info('Revoked share link', {
      share_link_id: id,
      artifact_id: shareLink.artifact_id,
      company_id: user.company_id,
      user_id: user.id,
    });

    return NextResponse.json<SuccessResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    return handleError(error);
  }
}
