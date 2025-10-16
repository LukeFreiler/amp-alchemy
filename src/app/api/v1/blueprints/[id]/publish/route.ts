/**
 * Blueprint Publish API Route
 *
 * POST /api/v1/blueprints/[id]/publish - Publish a draft blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Blueprint } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/v1/blueprints/[id]/publish
 *
 * Publish a draft blueprint (makes it available for creating sessions)
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Check blueprint exists and belongs to user's company
    const blueprint = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint');
    }

    // Only draft blueprints can be published
    if (blueprint.status === 'published') {
      throw new ValidationError('Blueprint is already published');
    }

    // Validate blueprint has at least one section
    const sectionCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM sections WHERE blueprint_id = $1',
      [id]
    );

    if (!sectionCount || sectionCount.count === 0) {
      throw new ValidationError('Blueprint must have at least one section');
    }

    // Validate blueprint has at least one field
    const fieldCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM fields f
       JOIN sections s ON s.id = f.section_id
       WHERE s.blueprint_id = $1`,
      [id]
    );

    if (!fieldCount || fieldCount.count === 0) {
      throw new ValidationError('Blueprint must have at least one field');
    }

    // Mark as published
    const updated = await queryOne<Blueprint>(
      `UPDATE blueprints
       SET status = 'published', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!updated) {
      throw new NotFoundError('Blueprint');
    }

    logger.info('Published blueprint', {
      blueprint_id: id,
      name: updated.name,
    });

    return NextResponse.json<SuccessResponse<Blueprint>>({
      ok: true,
      data: updated,
    });
  } catch (error) {
    return handleError(error);
  }
}
