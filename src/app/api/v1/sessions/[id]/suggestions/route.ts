/**
 * Session Suggestions API Route
 *
 * GET /api/v1/sessions/[id]/suggestions - List unreviewed field suggestions
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

type Suggestion = {
  id: string;
  session_id: string;
  field_id: string;
  field_key: string;
  field_label: string;
  section_title: string;
  section_order_index: number;
  field_order_index: number;
  value: string;
  confidence: number;
  source_provenance: Record<string, unknown> | null;
  reviewed: boolean;
  created_at: string;
};

/**
 * GET /api/v1/sessions/[id]/suggestions
 *
 * List all unreviewed AI-generated field suggestions for a session
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
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

    // Get all unreviewed suggestions with field and section metadata
    const suggestions = await query<Suggestion>(
      `SELECT
         sfv.id,
         sfv.session_id,
         sfv.field_id,
         f.key as field_key,
         f.label as field_label,
         s.title as section_title,
         s.order_index as section_order_index,
         f.order_index as field_order_index,
         sfv.value,
         sfv.confidence,
         sfv.source_provenance,
         sfv.reviewed,
         sfv.created_at
       FROM session_field_values sfv
       JOIN fields f ON f.id = sfv.field_id
       JOIN sections s ON s.id = f.section_id
       WHERE sfv.session_id = $1 AND sfv.reviewed = false
       ORDER BY s.order_index, f.order_index`,
      [sessionId]
    );

    logger.info('Fetched unreviewed suggestions', {
      session_id: sessionId,
      count: suggestions.length,
    });

    return NextResponse.json<SuccessResponse<Suggestion[]>>({
      ok: true,
      data: suggestions,
    });
  } catch (error) {
    return handleError(error);
  }
}
