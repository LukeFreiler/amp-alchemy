/**
 * Member invitation API endpoint
 *
 * POST /api/v1/members/invite
 * Allows owners and editors to invite new members via email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { execute, queryOne } from '@/lib/db/query';
import { handleError, ValidationError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendInvitationEmail } from '@/lib/email';
import { MemberRole } from '@/features/auth/types/session';
import { randomBytes } from 'crypto';

interface InviteRequest {
  email: string;
  role: MemberRole;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const body = (await req.json()) as InviteRequest;

    // Validate input
    if (!body.email?.trim()) {
      throw new ValidationError('Email is required');
    }

    const email = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!body.role || !['owner', 'editor', 'viewer'].includes(body.role)) {
      throw new ValidationError('Role must be owner, editor, or viewer');
    }

    // Check if member already exists in this company
    const existingMember = await queryOne(
      'SELECT id FROM members WHERE company_id = $1 AND email = $2',
      [user.company_id, email]
    );

    if (existingMember) {
      throw new ConflictError('Member with this email already exists in your company');
    }

    // Generate invite token
    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Store invitation
    await execute(
      `INSERT INTO pending_invitations (company_id, email, role, token, expires_at, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.company_id, email, body.role, inviteToken, expiresAt, user.id]
    );

    // Get company name for email
    const company = await queryOne<{ name: string }>(
      'SELECT name FROM companies WHERE id = $1',
      [user.company_id]
    );

    // Send invitation email
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite/${inviteToken}`;
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
        company_id: user.company_id,
        invited_by: user.id,
        email,
      });
      // Note: We don't throw here - invitation is still created in DB
    } else {
      logger.info('Invitation sent', {
        company_id: user.company_id,
        invited_by: user.id,
        email,
        role: body.role,
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        email,
        role: body.role,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
