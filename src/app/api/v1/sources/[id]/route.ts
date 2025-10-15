/**
 * Individual Source API Routes
 *
 * DELETE /api/v1/sources/[id] - Delete source
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { execute, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * DELETE /api/v1/sources/[id]
 *
 * Delete a source
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceId } = await params;
    const user = await requireAuth(['owner', 'editor']);

    // Verify source exists and belongs to user's company
    const source = await queryOne<{ company_id: string }>(
      `SELECT s.company_id
       FROM sources src
       JOIN sessions s ON s.id = src.session_id
       WHERE src.id = $1`,
      [sourceId]
    );

    if (!source) {
      throw new NotFoundError('Source');
    }

    if (source.company_id !== user.company_id) {
      throw new NotFoundError('Source');
    }

    // Delete source
    const deleteCount = await execute('DELETE FROM sources WHERE id = $1', [sourceId]);

    if (deleteCount === 0) {
      throw new NotFoundError('Source');
    }

    logger.info('Deleted source', {
      source_id: sourceId,
      company_id: user.company_id,
    });

    return NextResponse.json<SuccessResponse<{ deleted: true }>>({
      ok: true,
      data: { deleted: true },
    });
  } catch (error) {
    return handleError(error);
  }
}
