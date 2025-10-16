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

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${inviteToken}`;

    try {
      // Dynamically import Resend to avoid build issues
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Centercode Alchemy <noreply@centercode.com>',
        to: email,
        subject: `You've been invited to join Centercode Alchemy`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>You've been invited!</h1>
            <p>${user.name} has invited you to join their company on Centercode Alchemy as a <strong>${body.role}</strong>.</p>
            <p>
              <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">
                Accept Invitation
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This invitation will expire on ${expiresAt.toLocaleDateString()}.
            </p>
            <p style="color: #666; font-size: 12px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      logger.info('Invitation sent', {
        company_id: user.company_id,
        invited_by: user.id,
        email,
        role: body.role,
      });
    } catch (emailError) {
      logger.error('Failed to send invitation email', {
        error: emailError,
        email,
      });
      throw new Error('Failed to send invitation email');
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
