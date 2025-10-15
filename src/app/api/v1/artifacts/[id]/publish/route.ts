/**
 * Artifact Publishing API Route
 *
 * PUT /api/v1/artifacts/[id]/publish - Mark artifact as published
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

type Artifact = {
  id: string;
  session_id: string;
  company_id: string;
  published: boolean;
};

/**
 * PUT /api/v1/artifacts/[id]/publish
 *
 * Mark artifact as published (visible in Data Room)
 */
export async function PUT(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Fetch artifact to verify ownership
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
      throw new AuthorizationError('You do not have permission to publish this artifact');
    }

    // Mark as published
    await execute('UPDATE artifacts SET published = true, updated_at = NOW() WHERE id = $1', [id]);

    logger.info('Published artifact', {
      artifact_id: id,
      session_id: artifact.session_id,
      company_id: user.company_id,
      user_id: user.id,
    });

    return NextResponse.json<SuccessResponse<{ published: boolean }>>({
      ok: true,
      data: { published: true },
    });
  } catch (error) {
    return handleError(error);
  }
}
