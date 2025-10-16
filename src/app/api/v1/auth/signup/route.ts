/**
 * POST /api/v1/auth/signup
 *
 * User registration endpoint for email/password authentication.
 * Creates new member without company (onboarding flow will create company).
 * Sends welcome email.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { transaction } from '@/lib/db/query';
import { handleError, ValidationError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sendWelcomeEmail } from '@/lib/email';

interface SignupRequestBody {
  email: string;
  password: string;
  name: string;
}

const PASSWORD_MIN_LENGTH = 8;
const SALT_ROUNDS = 10;

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters and at least one number
 */
function isValidPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupRequestBody;
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new ValidationError('Email, password, and name are required');
    }

    // Validate email format
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength
    const passwordError = isValidPassword(password);
    if (passwordError) {
      throw new ValidationError(passwordError);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create member without company (onboarding will create company)
    const member = await transaction(async (client) => {
      // Check if email already exists
      const existingMember = await client.query('SELECT id FROM members WHERE email = $1', [email]);

      if (existingMember.rows.length > 0) {
        throw new ConflictError('Email already registered');
      }

      // Create member without company_id or role (set during onboarding)
      const memberResult = await client.query(
        `INSERT INTO members (name, email, password_hash, auth_method)
         VALUES ($1, $2, $3, $4)
         RETURNING id, company_id, role, name, email, auth_method`,
        [name, email, passwordHash, 'credentials']
      );
      const newMember = memberResult.rows[0] as {
        id: string;
        company_id: string | null;
        role: string | null;
        name: string;
        email: string;
        auth_method: string;
      };

      logger.info('New user signed up (pending onboarding)', {
        member_id: newMember.id,
        email,
        auth_method: 'credentials',
      });

      return newMember;
    });

    // Send welcome email (don't block on this)
    sendWelcomeEmail({ to: email, name }).catch((error) => {
      logger.error('Failed to send welcome email (non-blocking)', { error, email });
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          member: {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
