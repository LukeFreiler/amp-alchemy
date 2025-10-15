/**
 * Reject Suggestion API Route
 *
 * PUT /api/v1/sessions/[id]/suggestions/[suggestionId]/reject - Reject a suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse = {
  ok: true;
  data: { success: true };
};

/**
 * PUT /api/v1/sessions/[id]/suggestions/[suggestionId]/reject
 *
 * Reject an AI-generated field suggestion by clearing the value and marking as reviewed
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  try {
    const { id: sessionId, suggestionId } = await params;
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

    // Verify suggestion exists and belongs to this session
    const suggestion = await queryOne<{ session_id: string; field_id: string }>(
      'SELECT session_id, field_id FROM session_field_values WHERE id = $1',
      [suggestionId]
    );

    if (!suggestion || suggestion.session_id !== sessionId) {
      throw new NotFoundError('Suggestion');
    }

    // Reject: clear the value and mark as reviewed
    await execute(
      'UPDATE session_field_values SET value = NULL, reviewed = true, updated_at = NOW() WHERE id = $1',
      [suggestionId]
    );

    logger.info('Rejected suggestion', {
      session_id: sessionId,
      suggestion_id: suggestionId,
      user_id: user.id,
    });

    return NextResponse.json<SuccessResponse>({
      ok: true,
      data: { success: true },
    });
  } catch (error) {
    return handleError(error);
  }
}
