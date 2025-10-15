/**
 * Section [id] API Routes
 *
 * PUT    /api/v1/sections/[id] - Update section
 * DELETE /api/v1/sections/[id] - Delete section
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import {
  Section,
  UpdateSectionRequest,
} from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/v1/sections/[id]
 *
 * Update section title or description
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as UpdateSectionRequest;

    // Check section exists and belongs to user's company
    const existing = await queryOne<Section & { company_id: string }>(
      `SELECT s.*, b.company_id
       FROM sections s
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE s.id = $1`,
      [id]
    );

    if (!existing) {
      throw new NotFoundError('Section');
    }

    if (existing.company_id !== user.company_id) {
      throw new NotFoundError('Section');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        throw new ValidationError('Section title cannot be empty');
      }
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title.trim());
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description?.trim() || null);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const section = await queryOne<Section>(
      `UPDATE sections
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (!section) {
      throw new Error('Failed to update section');
    }

    logger.info('Updated section', {
      section_id: id,
      fields: Object.keys(body),
    });

    return NextResponse.json<SuccessResponse<Section>>({
      ok: true,
      data: section,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/sections/[id]
 *
 * Delete section (cascades to fields via DB constraints)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Check section exists and belongs to user's company
    const existing = await queryOne<Section & { company_id: string }>(
      `SELECT s.*, b.company_id
       FROM sections s
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE s.id = $1`,
      [id]
    );

    if (!existing) {
      throw new NotFoundError('Section');
    }

    if (existing.company_id !== user.company_id) {
      throw new NotFoundError('Section');
    }

    // Delete section (cascades to fields)
    await execute('DELETE FROM sections WHERE id = $1', [id]);

    logger.info('Deleted section', {
      section_id: id,
      title: existing.title,
    });

    return NextResponse.json<SuccessResponse<{ id: string }>>({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
