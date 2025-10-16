/**
 * Artifacts List API Route
 *
 * GET /api/v1/sessions/[id]/artifacts - List all artifacts for session
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type Session = {
  id: string;
  company_id: string;
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
  published: boolean;
};

type GroupedArtifacts = Record<
  string,
  {
    generator_id: string;
    generator_name: string;
    artifacts: Artifact[];
  }
>;

/**
 * GET /api/v1/sessions/[id]/artifacts
 *
 * List all artifacts for a session, grouped by generator
 * All authenticated users can view artifacts
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id: sessionId } = await context.params;

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [sessionId, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Fetch all artifacts for this session
    const artifacts = await query<Artifact>(
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
        COALESCE(
          (SELECT true FROM share_links sl
           WHERE sl.artifact_id = a.id AND sl.status = 'active'
           LIMIT 1),
          false
        ) as published
       FROM artifacts a
       JOIN blueprint_artifact_generators bag ON bag.id = a.generator_id
       JOIN members m ON m.id = a.created_by
       WHERE a.session_id = $1
       ORDER BY bag.order_index, a.version DESC`,
      [sessionId]
    );

    // Group by generator
    const grouped: GroupedArtifacts = {};

    for (const artifact of artifacts) {
      if (!grouped[artifact.generator_id]) {
        grouped[artifact.generator_id] = {
          generator_id: artifact.generator_id,
          generator_name: artifact.generator_name,
          artifacts: [],
        };
      }
      // Non-null assertion is safe here because we just ensured it exists
      grouped[artifact.generator_id]!.artifacts.push(artifact);
    }

    logger.info('Fetched artifacts for session', {
      session_id: sessionId,
      company_id: user.company_id,
      total_artifacts: artifacts.length,
      generators_count: Object.keys(grouped).length,
    });

    return NextResponse.json<SuccessResponse<GroupedArtifacts>>({
      ok: true,
      data: grouped,
    });
  } catch (error) {
    return handleError(error);
  }
}
