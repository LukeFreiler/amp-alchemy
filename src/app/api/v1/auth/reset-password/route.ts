/**
 * POST /api/v1/auth/reset-password
 *
 * Validates reset token and updates member password.
 * Tokens are single-use and expire after 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, transaction } from '@/lib/db/query';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface ResetPasswordRequestBody {
  token: string;
  password: string;
}

const PASSWORD_MIN_LENGTH = 8;
const SALT_ROUNDS = 10;

/**
 * Validate password strength
 */
function isValidPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResetPasswordRequestBody;
    const { token, password } = body;

    // Validate required fields
    if (!token || !password) {
      throw new ValidationError('Token and password are required');
    }

    // Validate password strength
    const passwordError = isValidPassword(password);
    if (passwordError) {
      throw new ValidationError(passwordError);
    }

    // Verify token and update password in transaction
    await transaction(async (client) => {
      // Find valid, unused token
      const tokenRecord = await queryOne<{
        id: string;
        member_id: string;
        expires_at: string;
        used_at: string | null;
      }>(
        `SELECT id, member_id, expires_at, used_at
         FROM password_reset_tokens
         WHERE token = $1`,
        [token]
      );

      if (!tokenRecord) {
        throw new NotFoundError('Invalid or expired reset token');
      }

      // Check if token has been used
      if (tokenRecord.used_at) {
        throw new ValidationError('Reset token has already been used');
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(tokenRecord.expires_at);
      if (now > expiresAt) {
        throw new ValidationError('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Update member password
      await client.query(
        `UPDATE members
         SET password_hash = $1,
             auth_method = CASE
               WHEN auth_method = 'oauth' THEN 'both'
               ELSE 'credentials'
             END
         WHERE id = $2`,
        [passwordHash, tokenRecord.member_id]
      );

      // Mark token as used
      await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [
        tokenRecord.id,
      ]);

      logger.info('Password reset successful', {
        member_id: tokenRecord.member_id,
        token_id: tokenRecord.id,
      });
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Password has been reset successfully',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
