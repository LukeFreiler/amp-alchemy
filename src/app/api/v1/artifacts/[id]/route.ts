/**
 * Artifact Detail API Routes
 *
 * GET    /api/v1/artifacts/[id]    - Get single artifact
 * DELETE /api/v1/artifacts/[id]    - Delete artifact (if not published)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import {
  handleError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '@/lib/errors';
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
  generator_id: string;
  generator_name: string;
  version: number;
  title: string;
  markdown: string;
  prompt_template_hash: string;
  created_by: string;
  creator_name: string;
  created_at: Date;
  company_id: string;
  published: boolean;
};

/**
 * GET /api/v1/artifacts/[id]
 *
 * Get single artifact with metadata
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor', 'viewer']);
    const { id } = await context.params;

    // Fetch artifact with session company_id for authorization
    const artifact = await queryOne<Artifact>(
      `SELECT
        a.id,
        a.session_id,
        a.generator_id,
        bag.name as generator_name,
        a.version,
        a.title,
        a.markdown,
        a.prompt_template_hash,
        a.created_by,
        m.name as creator_name,
        a.created_at,
        s.company_id,
        COALESCE(
          (SELECT true FROM share_links sl
           WHERE sl.artifact_id = a.id AND sl.status = 'active'
           LIMIT 1),
          false
        ) as published
       FROM artifacts a
       JOIN blueprint_artifact_generators bag ON bag.id = a.generator_id
       JOIN members m ON m.id = a.created_by
       JOIN sessions s ON s.id = a.session_id
       WHERE a.id = $1`,
      [id]
    );

    if (!artifact) {
      throw new NotFoundError('Artifact not found');
    }

    // Verify user has access to this artifact's session
    if (artifact.company_id !== user.company_id) {
      throw new AuthorizationError(
        'You do not have permission to access this artifact'
      );
    }

    logger.info('Fetched artifact', {
      artifact_id: id,
      session_id: artifact.session_id,
      company_id: user.company_id,
    });

    return NextResponse.json<SuccessResponse<Artifact>>({
      ok: true,
      data: artifact,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/artifacts/[id]
 *
 * Delete artifact (only if not published)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Fetch artifact to verify ownership and published status
    const artifact = await queryOne<Artifact>(
      `SELECT
        a.id,
        a.session_id,
        s.company_id,
        COALESCE(
          (SELECT true FROM share_links sl
           WHERE sl.artifact_id = a.id AND sl.status = 'active'
           LIMIT 1),
          false
        ) as published
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
        'You do not have permission to delete this artifact'
      );
    }

    // Check if published
    if (artifact.published) {
      throw new ConflictError(
        'Cannot delete published artifact. Unpublish it first.'
      );
    }

    // Delete artifact
    await execute('DELETE FROM artifacts WHERE id = $1', [id]);

    logger.info('Deleted artifact', {
      artifact_id: id,
      session_id: artifact.session_id,
      company_id: user.company_id,
    });

    return NextResponse.json<SuccessResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    return handleError(error);
  }
}
