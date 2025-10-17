/**
 * Invitation acceptance endpoint
 *
 * POST /api/v1/invitations/accept/[token]
 * Accepts an invitation and adds user to the company (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { queryOne, transaction } from '@/lib/db/query';
import {
  handleError,
  NotFoundError,
  AuthenticationError,
  ValidationError,
  ConflictError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const user = await getAuthUser();
    const { token } = await params;

    if (!user) {
      throw new AuthenticationError('Authentication required to accept invitation');
    }

    // Look up invitation
    const invitation = await queryOne<{
      id: string;
      company_id: string;
      email: string;
      role: string;
      expires_at: string;
    }>(
      `SELECT id, company_id, email, role, expires_at
       FROM pending_invitations
       WHERE token = $1 AND accepted_at IS NULL`,
      [token]
    );

    if (!invitation) {
      throw new NotFoundError('Invitation not found or already accepted');
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new ValidationError('This invitation has expired');
    }

    // Check if email matches (case insensitive)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ValidationError('This invitation was sent to a different email address');
    }

    // Check if user already belongs to a company
    if (user.company_id) {
      throw new ConflictError(
        'You already belong to a company. Please contact support to switch companies.'
      );
    }

    // Accept invitation in a transaction
    const result = await transaction(async (client) => {
      // Update member with company_id and role
      await client.query(
        `UPDATE members
         SET company_id = $1, role = $2, invitation_token = $3
         WHERE id = $4`,
        [invitation.company_id, invitation.role, token, user.id]
      );

      // Mark invitation as accepted
      await client.query(
        `UPDATE pending_invitations
         SET accepted_at = NOW()
         WHERE id = $1`,
        [invitation.id]
      );

      return {
        company_id: invitation.company_id,
        role: invitation.role,
      };
    });

    logger.info('Invitation accepted', {
      invitation_id: invitation.id,
      company_id: invitation.company_id,
      member_id: user.id,
      email: invitation.email,
      role: invitation.role,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
