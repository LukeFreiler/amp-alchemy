/**
 * POST /api/v1/auth/signup
 *
 * User registration endpoint for email/password authentication.
 * Creates new member and company, sends welcome email.
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
  companyName?: string;
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
    const { email, password, name, companyName } = body;

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

    // Create member and company in transaction
    const result = await transaction(async (client) => {
      // Check if email already exists
      const existingMember = await client.query('SELECT id FROM members WHERE email = $1', [email]);

      if (existingMember.rows.length > 0) {
        throw new ConflictError('Email already registered');
      }

      // Create company
      const defaultCompanyName = companyName || `${name}'s Company`;
      const companyResult = await client.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id',
        [defaultCompanyName]
      );
      const company = companyResult.rows[0] as { id: string };

      // Create member with credentials auth
      const memberResult = await client.query(
        `INSERT INTO members (company_id, role, name, email, password_hash, auth_method)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, company_id, role, name, email, auth_method`,
        [company.id, 'owner', name, email, passwordHash, 'credentials']
      );
      const member = memberResult.rows[0] as {
        id: string;
        company_id: string;
        role: string;
        name: string;
        email: string;
        auth_method: string;
      };

      logger.info('New user signed up', {
        member_id: member.id,
        company_id: company.id,
        email,
        auth_method: 'credentials',
      });

      return { member, company };
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
            id: result.member.id,
            name: result.member.name,
            email: result.member.email,
            role: result.member.role,
          },
          company: {
            id: result.company.id,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
