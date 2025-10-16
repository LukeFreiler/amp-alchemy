/**
 * Invitation validation endpoint
 *
 * GET /api/v1/invitations/validate/[token]
 * Validates an invitation token and returns invitation details (no auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/query';
import { handleError, NotFoundError } from '@/lib/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Look up invitation with company and inviter details
    const invitation = await queryOne<{
      company_name: string;
      role: string;
      inviter_name: string;
      expires_at: string;
    }>(
      `SELECT
        c.name as company_name,
        pi.role,
        m.name as inviter_name,
        pi.expires_at
       FROM pending_invitations pi
       JOIN companies c ON pi.company_id = c.id
       JOIN members m ON pi.invited_by = m.id
       WHERE pi.token = $1 AND pi.accepted_at IS NULL`,
      [token]
    );

    if (!invitation) {
      throw new NotFoundError('Invitation not found or already accepted');
    }

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date();

    return NextResponse.json({
      ok: true,
      data: {
        company_name: invitation.company_name,
        role: invitation.role,
        inviter_name: invitation.inviter_name,
        is_expired: isExpired,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
