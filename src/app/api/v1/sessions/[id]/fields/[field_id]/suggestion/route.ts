/**
 * Field Suggestion API Route
 *
 * GET /api/v1/sessions/[id]/fields/[field_id]/suggestion - Get unreviewed suggestion for a specific field
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type Suggestion = {
  id: string;
  value: string;
  confidence: number;
  source_provenance: Record<string, unknown> | null;
};

/**
 * GET /api/v1/sessions/[id]/fields/[field_id]/suggestion
 *
 * Fetch the unreviewed AI suggestion for a specific field in a session
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; field_id: string }> }
) {
  try {
    const { id: sessionId, field_id: fieldId } = await params;
    const user = await requireAuth(['owner', 'editor']);

    // Verify session exists and belongs to user's company
    const session = await queryOne<{ company_id: string }>(
      'SELECT company_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (!session) {
      throw new NotFoundError('Session');
    }

    if (session.company_id !== user.company_id) {
      throw new NotFoundError('Session');
    }

    // Get unreviewed suggestion for this field
    const suggestion = await queryOne<Suggestion>(
      `SELECT
         sfv.id,
         sfv.value,
         sfv.confidence,
         sfv.source_provenance
       FROM session_field_values sfv
       WHERE sfv.session_id = $1
         AND sfv.field_id = $2
         AND sfv.reviewed = false
       LIMIT 1`,
      [sessionId, fieldId]
    );

    return NextResponse.json<SuccessResponse<Suggestion | null>>({
      ok: true,
      data: suggestion || null,
    });
  } catch (error) {
    return handleError(error);
  }
}
