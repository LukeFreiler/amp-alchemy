/**
 * Session Detail API Routes
 *
 * GET    /api/v1/sessions/[id]      - Get session with blueprint sections and progress
 * PUT    /api/v1/sessions/[id]      - Update session metadata
 * DELETE /api/v1/sessions/[id]      - Delete session
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, ValidationError } from '@/lib/errors';
import { query, queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import {
  Session,
  SessionWithSections,
  SectionWithProgress,
  UpdateSessionRequest,
} from '@/features/sessions/types/session';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/sessions/[id]
 *
 * Get session with blueprint sections and progress tracking
 * All authenticated users can view sessions
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;

    // Fetch session
    const session = await queryOne<Session>(
      `SELECT s.*, b.name as blueprint_name
       FROM sessions s
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE s.id = $1 AND s.company_id = $2`,
      [id, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Fetch sections with progress tracking
    const sections = await query<SectionWithProgress>(
      `SELECT
        s.*,
        COALESCE(
          (SELECT COUNT(*)::int
           FROM fields f
           WHERE f.section_id = s.id AND f.required = true),
          0
        ) as required_count,
        COALESCE(
          (SELECT COUNT(*)::int
           FROM session_field_values sfv
           JOIN fields f ON f.id = sfv.field_id
           WHERE sfv.session_id = $1
             AND f.section_id = s.id
             AND f.required = true
             AND sfv.value IS NOT NULL
             AND sfv.value != ''),
          0
        ) as required_filled_count,
        COALESCE(
          (SELECT COUNT(*)::int
           FROM fields f
           WHERE f.section_id = s.id),
          0
        ) as total_count,
        COALESCE(
          (SELECT COUNT(*)::int
           FROM session_field_values sfv
           JOIN fields f ON f.id = sfv.field_id
           WHERE sfv.session_id = $1
             AND f.section_id = s.id
             AND sfv.value IS NOT NULL
             AND sfv.value != ''),
          0
        ) as total_filled_count,
        0 as completion_percentage,
        0 as total_completion_percentage
       FROM sections s
       WHERE s.blueprint_id = $2
       ORDER BY s.order_index`,
      [id, session.blueprint_id]
    );

    // Calculate completion percentages
    const sectionsWithProgress = sections.map((section) => ({
      ...section,
      completion_percentage:
        section.required_count > 0
          ? Math.round((section.required_filled_count / section.required_count) * 100)
          : 100,
      total_completion_percentage:
        section.total_count > 0
          ? Math.round((section.total_filled_count / section.total_count) * 100)
          : 100,
    }));

    const sessionWithSections: SessionWithSections = {
      ...session,
      sections: sectionsWithProgress,
    };

    logger.info('Fetched session', {
      session_id: id,
      company_id: user.company_id,
      section_count: sections.length,
    });

    return NextResponse.json<SuccessResponse<SessionWithSections>>({
      ok: true,
      data: sessionWithSections,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/v1/sessions/[id]
 *
 * Update session metadata (name, status)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as UpdateSessionRequest;

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        throw new ValidationError('Session name must be a non-empty string');
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name.trim());
    }

    if (body.status !== undefined) {
      const validStatuses: string[] = ['in_progress', 'completed', 'archived'];
      if (!validStatuses.includes(body.status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Add WHERE clause parameters
    values.push(id, user.company_id);

    const updatedSession = await queryOne<Session>(
      `UPDATE sessions
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    logger.info('Updated session', {
      session_id: id,
      company_id: user.company_id,
      updates: Object.keys(body),
    });

    return NextResponse.json<SuccessResponse<Session>>({
      ok: true,
      data: updatedSession!,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/sessions/[id]
 *
 * Delete session and all related data
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Delete session (cascade will handle related data)
    await execute('DELETE FROM sessions WHERE id = $1', [id]);

    logger.info('Deleted session', {
      session_id: id,
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
