/**
 * Team member management endpoints
 *
 * PUT /api/v1/members/[id] - Update member role (owner only)
 * DELETE /api/v1/members/[id] - Remove member from company (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { execute, queryOne } from '@/lib/db/query';
import { handleError, NotFoundError, AuthorizationError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { UpdateMemberRoleRequest } from '@/features/team/types';

/**
 * PUT /api/v1/members/[id]
 * Update a member's role
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(['owner']);
    const { id } = await params;
    const body = (await req.json()) as UpdateMemberRoleRequest;

    // Validate role
    if (!body.role || !['owner', 'editor', 'viewer'].includes(body.role)) {
      throw new ValidationError('Role must be owner, editor, or viewer');
    }

    // Get target member
    const targetMember = await queryOne<{ company_id: string; role: string }>(
      'SELECT company_id, role FROM members WHERE id = $1',
      [id]
    );

    if (!targetMember) {
      throw new NotFoundError('Member not found');
    }

    if (targetMember.company_id !== user.company_id) {
      throw new AuthorizationError('Cannot modify member from another company');
    }

    // Prevent demoting the last owner
    if (targetMember.role === 'owner' && body.role !== 'owner') {
      const ownerCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM members WHERE company_id = $1 AND role = $2',
        [user.company_id, 'owner']
      );

      if (ownerCount && parseInt(ownerCount.count) <= 1) {
        throw new ValidationError('Cannot demote the last owner. Promote another member first.');
      }
    }

    // Update role
    await execute('UPDATE members SET role = $1 WHERE id = $2', [body.role, id]);

    logger.info('Member role updated', {
      member_id: id,
      company_id: user.company_id,
      updated_by: user.id,
      new_role: body.role,
    });

    return NextResponse.json({
      ok: true,
      data: { id, role: body.role },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/members/[id]
 * Remove a member from the company
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(['owner']);
    const { id } = await params;

    // Prevent self-removal
    if (id === user.id) {
      throw new ValidationError(
        'You cannot remove yourself. Transfer ownership to another member first.'
      );
    }

    // Get target member
    const targetMember = await queryOne<{ company_id: string; role: string; email: string }>(
      'SELECT company_id, role, email FROM members WHERE id = $1',
      [id]
    );

    if (!targetMember) {
      throw new NotFoundError('Member not found');
    }

    if (targetMember.company_id !== user.company_id) {
      throw new AuthorizationError('Cannot remove member from another company');
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const ownerCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM members WHERE company_id = $1 AND role = $2',
        [user.company_id, 'owner']
      );

      if (ownerCount && parseInt(ownerCount.count) <= 1) {
        throw new ValidationError('Cannot remove the last owner');
      }
    }

    // Delete member
    await execute('DELETE FROM members WHERE id = $1', [id]);

    logger.info('Member removed', {
      member_id: id,
      company_id: user.company_id,
      removed_by: user.id,
      member_email: targetMember.email,
    });

    return NextResponse.json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
