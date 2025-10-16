/**
 * Team invitations API endpoints
 *
 * POST /api/v1/invitations - Create a new invitation (owner only)
 * GET /api/v1/invitations - List pending invitations (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db/query';
import { handleError, ValidationError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendInvitationEmail } from '@/lib/email';
import { CreateInvitationRequest } from '@/features/team/types';
import { randomBytes } from 'crypto';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * POST /api/v1/invitations
 * Create a new team invitation and send email
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['owner']);
    const body = (await req.json()) as CreateInvitationRequest;

    // Validate email
    if (!body.email?.trim()) {
      throw new ValidationError('Email is required');
    }

    const email = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate role
    if (!body.role || !['owner', 'editor', 'viewer'].includes(body.role)) {
      throw new ValidationError('Role must be owner, editor, or viewer');
    }

    // Check if member already exists
    const existingMember = await queryOne(
      'SELECT id FROM members WHERE company_id = $1 AND email = $2',
      [user.company_id, email]
    );

    if (existingMember) {
      throw new ConflictError('A member with this email already exists in your company');
    }

    // Check if invitation already exists
    const existingInvitation = await queryOne(
      'SELECT id FROM pending_invitations WHERE company_id = $1 AND email = $2 AND accepted_at IS NULL',
      [user.company_id, email]
    );

    if (existingInvitation) {
      throw new ConflictError('An invitation for this email is already pending');
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation
    const invitation = await queryOne<{ id: string }>(
      `INSERT INTO pending_invitations (company_id, email, role, token, expires_at, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [user.company_id, email, body.role, token, expiresAt, user.id]
    );

    // Send invitation email
    const acceptUrl = `${APP_URL}/auth/accept-invite/${token}`;

    // Get company name for email
    const company = await queryOne<{ name: string }>(
      'SELECT name FROM companies WHERE id = $1',
      [user.company_id]
    );

    const emailSent = await sendInvitationEmail({
      to: email,
      inviterName: user.name,
      companyName: company?.name || 'Unknown Company',
      role: body.role,
      acceptUrl,
      expiresAt,
    });

    if (!emailSent) {
      logger.warn('Invitation created but email failed to send', {
        invitation_id: invitation?.id,
        email,
      });
    }

    logger.info('Invitation created', {
      invitation_id: invitation?.id,
      company_id: user.company_id,
      invited_by: user.id,
      email,
      role: body.role,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: invitation?.id,
        email,
        role: body.role,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/invitations
 * List all pending invitations for the user's company
 */
export async function GET() {
  try {
    const user = await requireAuth(['owner']);

    const invitations = await query<{
      id: string;
      email: string;
      role: string;
      expires_at: string;
      created_at: string;
      invited_by_name: string;
    }>(
      `SELECT
        pi.id,
        pi.email,
        pi.role,
        pi.expires_at,
        pi.created_at,
        m.name as invited_by_name
       FROM pending_invitations pi
       JOIN members m ON pi.invited_by = m.id
       WHERE pi.company_id = $1 AND pi.accepted_at IS NULL
       ORDER BY pi.created_at DESC`,
      [user.company_id]
    );

    return NextResponse.json({
      ok: true,
      data: invitations,
    });
  } catch (error) {
    return handleError(error);
  }
}
