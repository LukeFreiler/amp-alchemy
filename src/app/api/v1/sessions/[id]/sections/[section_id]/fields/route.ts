/**
 * Session Section Fields API Routes
 *
 * GET /api/v1/sessions/[id]/sections/[section_id]/fields - Get fields with values for a section
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Field } from '@/features/blueprints/types/blueprint';
import { Session } from '@/features/sessions/types/session';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string; section_id: string }>;
};

export interface FieldWithValue extends Field {
  value?: string | null;
  confidence: number | null;
  reviewed: boolean;
}

/**
 * GET /api/v1/sessions/[id]/sections/[section_id]/fields
 *
 * Get all fields for a section with their current values
 * All authenticated users can view fields
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id: sessionId, section_id: sectionId } = await context.params;

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [sessionId, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Get fields with values
    const fields = await query<FieldWithValue>(
      `SELECT
        f.*,
        sfv.value,
        sfv.confidence,
        COALESCE(sfv.reviewed, false) as reviewed
       FROM fields f
       LEFT JOIN session_field_values sfv
         ON sfv.field_id = f.id
         AND sfv.session_id = $1
       WHERE f.section_id = $2
       ORDER BY f.order_index`,
      [sessionId, sectionId]
    );

    logger.info('Fetched section fields', {
      session_id: sessionId,
      section_id: sectionId,
      company_id: user.company_id,
      field_count: fields.length,
    });

    return NextResponse.json<SuccessResponse<FieldWithValue[]>>({
      ok: true,
      data: fields,
    });
  } catch (error) {
    return handleError(error);
  }
}
