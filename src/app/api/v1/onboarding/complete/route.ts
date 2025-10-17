/**
 * Onboarding completion endpoint
 *
 * POST /api/v1/onboarding/complete
 * Completes user onboarding by creating a company and assigning the user as owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { transaction } from '@/lib/db/query';
import { handleError, ValidationError, AuthenticationError, ConflictError } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface OnboardingCompleteRequest {
  company_name: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user (but don't require company_id)
    const user = await getAuthUser();

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    // Check if user already has a company
    if (user.company_id) {
      throw new ConflictError('User already belongs to a company');
    }

    const body = (await req.json()) as OnboardingCompleteRequest;

    // Validate company name
    if (!body.company_name?.trim()) {
      throw new ValidationError('Company name is required');
    }

    const companyName = body.company_name.trim();

    if (companyName.length < 2) {
      throw new ValidationError('Company name must be at least 2 characters');
    }

    if (companyName.length > 255) {
      throw new ValidationError('Company name must be less than 255 characters');
    }

    // Create company and update member in a transaction
    const result = await transaction(async (client) => {
      // Create company
      const company = await client.query(`INSERT INTO companies (name) VALUES ($1) RETURNING id`, [
        companyName,
      ]);

      const companyId = (company.rows[0] as { id: string }).id;

      // Update member with company_id and set as owner
      await client.query(`UPDATE members SET company_id = $1, role = 'owner' WHERE id = $2`, [
        companyId,
        user.id,
      ]);

      return { company_id: companyId };
    });

    logger.info('Onboarding completed', {
      user_id: user.id,
      company_id: result.company_id,
      company_name: companyName,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
