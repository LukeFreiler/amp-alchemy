/**
 * POST /api/v1/auth/forgot-password
 *
 * Generates password reset token and sends email.
 * Tokens expire after 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryOne, execute } from '@/lib/db/query';
import { handleError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendPasswordResetEmail } from '@/lib/email';

interface ForgotPasswordRequestBody {
  email: string;
}

const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate secure random token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ForgotPasswordRequestBody;
    const { email } = body;

    // Validate required fields
    if (!email) {
      throw new ValidationError('Email is required');
    }

    // Find member by email
    const member = await queryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string | null;
      auth_method: string;
    }>('SELECT id, name, email, password_hash, auth_method FROM members WHERE email = $1', [email]);

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (!member) {
      logger.info('Password reset requested for non-existent email', { email });
      return NextResponse.json({
        ok: true,
        data: {
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
      });
    }

    // Check if user has credentials auth (password set)
    if (member.auth_method === 'oauth' || !member.password_hash) {
      logger.info('Password reset requested for OAuth-only account', { email });
      // Still return success to avoid enumeration
      return NextResponse.json({
        ok: true,
        data: {
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Store token in database
    await execute(
      `INSERT INTO password_reset_tokens (member_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [member.id, resetToken, expiresAt]
    );

    logger.info('Password reset token created', {
      member_id: member.id,
      email,
      expires_at: expiresAt,
    });

    // Send password reset email (don't block on this)
    sendPasswordResetEmail({
      to: email,
      name: member.name,
      resetToken,
    }).catch((error) => {
      logger.error('Failed to send password reset email (non-blocking)', { error, email });
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: 'If an account exists with this email, a password reset link has been sent.',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
