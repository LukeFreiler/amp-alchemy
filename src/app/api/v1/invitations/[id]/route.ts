/**
 * Delete invitation endpoint
 *
 * DELETE /api/v1/invitations/[id] - Cancel a pending invitation (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { execute, queryOne } from '@/lib/db/query';
import { handleError, NotFoundError, AuthorizationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(['owner']);
    const { id } = await params;

    // Verify invitation exists and belongs to user's company
    const invitation = await queryOne<{ company_id: string; email: string }>(
      'SELECT company_id, email FROM pending_invitations WHERE id = $1 AND accepted_at IS NULL',
      [id]
    );

    if (!invitation) {
      throw new NotFoundError('Invitation not found or already accepted');
    }

    if (invitation.company_id !== user.company_id) {
      throw new AuthorizationError('Cannot delete invitation from another company');
    }

    // Delete invitation
    await execute('DELETE FROM pending_invitations WHERE id = $1', [id]);

    logger.info('Invitation deleted', {
      invitation_id: id,
      company_id: user.company_id,
      deleted_by: user.id,
      email: invitation.email,
    });

    return NextResponse.json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
