/**
 * Company management API endpoints
 *
 * GET  /api/v1/companies - Get current user's company
 * PUT  /api/v1/companies - Update company settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { queryOne, execute } from '@/lib/db/query';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { Company } from '@/features/auth/types/session';

export async function GET() {
  try {
    const user = await requireAuth();

    const company = await queryOne<Company>(
      'SELECT id, name, created_at, updated_at FROM companies WHERE id = $1',
      [user.company_id]
    );

    if (!company) {
      throw new NotFoundError('Company');
    }

    return NextResponse.json({
      ok: true,
      data: company,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { name } = await req.json();

    if (!name?.trim()) {
      throw new ValidationError('Company name is required');
    }

    if (name.trim().length > 255) {
      throw new ValidationError('Company name must be 255 characters or less');
    }

    const updatedCount = await execute(
      'UPDATE companies SET name = $1, updated_at = NOW() WHERE id = $2',
      [name.trim(), user.company_id]
    );

    if (updatedCount === 0) {
      throw new NotFoundError('Company');
    }

    logger.info('Company updated', {
      company_id: user.company_id,
      updated_by: user.id,
      name: name.trim(),
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: user.company_id,
        name: name.trim(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
