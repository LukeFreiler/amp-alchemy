/**
 * Section Notes API Routes
 *
 * GET /api/v1/sessions/[id]/sections/[section_id]/notes - Get section notes
 * PUT /api/v1/sessions/[id]/sections/[section_id]/notes - Update section notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, ValidationError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { SectionNote, UpdateSectionNotesRequest } from '@/features/sessions/types/session';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string; section_id: string }>;
};

/**
 * GET /api/v1/sessions/[id]/sections/[section_id]/notes
 *
 * Get section notes for a session
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id, section_id } = await context.params;

    // Verify session exists and belongs to company
    const session = await queryOne<{ id: string; company_id: string }>(
      'SELECT id, company_id FROM sessions WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Fetch section notes (may not exist yet)
    const notes = await queryOne<SectionNote>(
      'SELECT * FROM section_notes WHERE session_id = $1 AND section_id = $2',
      [id, section_id]
    );

    // Return empty notes if not found
    const response: SectionNote | { markdown: string } = notes || { markdown: '' };

    return NextResponse.json<SuccessResponse<SectionNote | { markdown: string }>>({
      ok: true,
      data: response,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/v1/sessions/[id]/sections/[section_id]/notes
 *
 * Update section notes (upsert)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id, section_id } = await context.params;
    const body = (await request.json()) as UpdateSectionNotesRequest;

    // Validate markdown field
    if (body.markdown === undefined || typeof body.markdown !== 'string') {
      throw new ValidationError('Markdown content is required');
    }

    // Verify session exists and belongs to company
    const session = await queryOne<{ id: string; company_id: string }>(
      'SELECT id, company_id FROM sessions WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Verify section exists
    const section = await queryOne<{ id: string }>(
      'SELECT id FROM sections WHERE id = $1',
      [section_id]
    );

    if (!section) {
      throw new NotFoundError('Section not found');
    }

    // Upsert section notes
    const notes = await queryOne<SectionNote>(
      `INSERT INTO section_notes (session_id, section_id, markdown)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, section_id)
       DO UPDATE SET markdown = $3, updated_at = NOW()
       RETURNING *`,
      [id, section_id, body.markdown]
    );

    logger.info('Updated section notes', {
      session_id: id,
      section_id: section_id,
      company_id: user.company_id,
    });

    return NextResponse.json<SuccessResponse<SectionNote>>({
      ok: true,
      data: notes!,
    });
  } catch (error) {
    return handleError(error);
  }
}
