/**
 * Artifact Save API Route
 *
 * POST /api/v1/sessions/[id]/artifacts/save - Save generated artifact
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, ValidationError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SaveRequest = {
  generator_id: string;
  markdown: string;
  prompt_template_hash: string;
};

type Artifact = {
  id: string;
  session_id: string;
  generator_id: string;
  version: number;
  title: string;
  markdown: string;
  prompt_template_hash: string;
  created_by: string;
  created_at: Date;
};

type Session = {
  id: string;
  company_id: string;
};

type MaxVersion = {
  max: number;
};

type Generator = {
  name: string;
};

/**
 * POST /api/v1/sessions/[id]/artifacts/save
 *
 * Save generated artifact with version tracking
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id: sessionId } = await context.params;
    const body = (await request.json()) as SaveRequest;

    if (!body.generator_id) {
      throw new ValidationError('generator_id is required');
    }

    if (!body.markdown || body.markdown.trim() === '') {
      throw new ValidationError('markdown content is required');
    }

    if (!body.prompt_template_hash) {
      throw new ValidationError('prompt_template_hash is required');
    }

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [sessionId, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Verify generator exists
    const generator = await queryOne<Generator>(
      'SELECT name FROM blueprint_artifact_generators WHERE id = $1',
      [body.generator_id]
    );

    if (!generator) {
      throw new NotFoundError('Generator not found');
    }

    // Get current max version for this session + generator
    const maxVersion = await queryOne<MaxVersion>(
      'SELECT COALESCE(MAX(version), 0) as max FROM artifacts WHERE session_id = $1 AND generator_id = $2',
      [sessionId, body.generator_id]
    );

    const nextVersion = (maxVersion?.max || 0) + 1;
    const title = `${generator.name} v${nextVersion}`;

    // Insert artifact
    const artifact = await queryOne<Artifact>(
      `INSERT INTO artifacts (session_id, generator_id, version, title, markdown, prompt_template_hash, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        sessionId,
        body.generator_id,
        nextVersion,
        title,
        body.markdown,
        body.prompt_template_hash,
        user.id,
      ]
    );

    logger.info('Artifact saved', {
      artifact_id: artifact!.id,
      session_id: sessionId,
      generator_id: body.generator_id,
      version: nextVersion,
      markdown_length: body.markdown.length,
    });

    return NextResponse.json<SuccessResponse<Artifact>>({
      ok: true,
      data: artifact!,
    });
  } catch (error) {
    return handleError(error);
  }
}
