/**
 * Session Field Value API Routes
 *
 * PUT /api/v1/sessions/[id]/fields/[field_id] - Update field value and autosave
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, ValidationError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Session } from '@/features/sessions/types/session';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string; field_id: string }>;
};

interface UpdateFieldValueRequest {
  value: string;
}

interface UpdateFieldValueResponse {
  success: boolean;
  completion_percent: number;
  status: string;
}

/**
 * Helper function to update session completion percentage
 */
async function updateSessionCompletion(sessionId: string): Promise<{
  completion_percent: number;
  status: string;
}> {
  const result = await queryOne<{
    required_count: number;
    filled_count: number;
  }>(
    `SELECT
      COUNT(CASE WHEN f.required = true THEN 1 END)::int as required_count,
      COUNT(CASE WHEN f.required = true AND sfv.value IS NOT NULL AND sfv.value != '' THEN 1 END)::int as filled_count
     FROM fields f
     JOIN sections s ON s.id = f.section_id
     JOIN sessions sess ON sess.blueprint_id = s.blueprint_id
     LEFT JOIN session_field_values sfv ON sfv.field_id = f.id AND sfv.session_id = $1
     WHERE sess.id = $1`,
    [sessionId]
  );

  if (!result) {
    return { completion_percent: 0, status: 'in_progress' };
  }

  const percent =
    result.required_count > 0
      ? Math.round((result.filled_count / result.required_count) * 100)
      : 100;

  const status = percent === 100 ? 'completed' : 'in_progress';

  await execute(
    'UPDATE sessions SET completion_percent = $1, status = $2, updated_at = NOW() WHERE id = $3',
    [percent, status, sessionId]
  );

  return { completion_percent: percent, status };
}

/**
 * PUT /api/v1/sessions/[id]/fields/[field_id]
 *
 * Update field value and recalculate session completion
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id: sessionId, field_id: fieldId } = await context.params;
    const body = (await request.json()) as UpdateFieldValueRequest;

    // Validate input
    if (body.value === undefined) {
      throw new ValidationError('Field value is required');
    }

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [sessionId, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Verify field exists (and belongs to the session's blueprint)
    const fieldExists = await queryOne(
      `SELECT f.id
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       JOIN sessions sess ON sess.blueprint_id = s.blueprint_id
       WHERE f.id = $1 AND sess.id = $2`,
      [fieldId, sessionId]
    );

    if (!fieldExists) {
      throw new NotFoundError('Field not found for this session');
    }

    // Upsert field value
    await execute(
      `INSERT INTO session_field_values (session_id, field_id, value, reviewed)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (session_id, field_id)
       DO UPDATE SET
         value = $3,
         reviewed = true,
         updated_at = NOW()`,
      [sessionId, fieldId, body.value]
    );

    // Recalculate completion
    const { completion_percent, status } = await updateSessionCompletion(sessionId);

    logger.info('Updated field value', {
      session_id: sessionId,
      field_id: fieldId,
      company_id: user.company_id,
      completion_percent,
      status,
    });

    return NextResponse.json<SuccessResponse<UpdateFieldValueResponse>>({
      ok: true,
      data: {
        success: true,
        completion_percent,
        status,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
