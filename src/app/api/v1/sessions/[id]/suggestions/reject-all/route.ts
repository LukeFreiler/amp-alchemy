/**
 * Reject All Suggestions API Route
 *
 * PUT /api/v1/sessions/[id]/suggestions/reject-all - Reject all unreviewed suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse = {
  ok: true;
  data: { count: number };
};

/**
 * PUT /api/v1/sessions/[id]/suggestions/reject-all
 *
 * Reject all unreviewed AI-generated field suggestions by clearing values and marking as reviewed
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Reject all: clear values and mark as reviewed
    const count = await execute(
      'UPDATE session_field_values SET value = NULL, reviewed = true, updated_at = NOW() WHERE session_id = $1 AND reviewed = false',
      [sessionId]
    );

    logger.info('Rejected all suggestions', {
      session_id: sessionId,
      count,
      user_id: user.id,
    });

    return NextResponse.json<SuccessResponse>({
      ok: true,
      data: { count },
    });
  } catch (error) {
    return handleError(error);
  }
}
