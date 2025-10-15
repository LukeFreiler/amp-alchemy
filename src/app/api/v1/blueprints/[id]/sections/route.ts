/**
 * Blueprint Sections API Route
 *
 * POST /api/v1/blueprints/[id]/sections - Add section to blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import {
  Blueprint,
  Section,
  CreateSectionRequest,
} from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/v1/blueprints/[id]/sections
 *
 * Add a new section to a blueprint
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as CreateSectionRequest;

    // Validate title
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      throw new ValidationError('Section title is required');
    }

    // Check blueprint exists and belongs to user's company
    const blueprint = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint');
    }

    // Get max order_index for this blueprint
    const maxOrder = await queryOne<{ max: number | null }>(
      'SELECT MAX(order_index) as max FROM sections WHERE blueprint_id = $1',
      [id]
    );

    const nextOrder = (maxOrder?.max ?? -1) + 1;

    // Create section
    const section = await queryOne<Section>(
      `INSERT INTO sections (blueprint_id, order_index, title, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, nextOrder, body.title.trim(), body.description?.trim() || null]
    );

    logger.info('Created section', {
      section_id: section.id,
      blueprint_id: id,
      title: section.title,
    });

    return NextResponse.json<SuccessResponse<Section>>(
      {
        ok: true,
        data: section,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
