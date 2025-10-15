/**
 * Share Links List API Route
 *
 * GET /api/v1/share-links - List all share links for company
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError } from '@/lib/errors';
import { query } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type ShareLinkWithDetails = {
  id: string;
  artifact_id: string;
  artifact_title: string;
  session_name: string;
  token: string;
  allow_source_upload: boolean;
  expires_at: Date | null;
  created_by: string;
  creator_name: string;
  created_at: Date;
};

/**
 * GET /api/v1/share-links
 *
 * List all share links for the user's company
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);

    // Fetch all share links for company with artifact details
    const links = await query<ShareLinkWithDetails>(
      `SELECT
        sl.id,
        sl.artifact_id,
        a.title as artifact_title,
        sess.name as session_name,
        sl.token,
        sl.allow_source_upload,
        sl.expires_at,
        sl.created_by,
        m.name as creator_name,
        sl.created_at
       FROM share_links sl
       JOIN artifacts a ON a.id = sl.artifact_id
       JOIN sessions sess ON sess.id = a.session_id
       JOIN members m ON m.id = sl.created_by
       WHERE sess.company_id = $1
       ORDER BY sl.created_at DESC`,
      [user.company_id]
    );

    logger.info('Fetched share links', {
      company_id: user.company_id,
      count: links.length,
    });

    return NextResponse.json<SuccessResponse<ShareLinkWithDetails[]>>({
      ok: true,
      data: links,
    });
  } catch (error) {
    return handleError(error);
  }
}
