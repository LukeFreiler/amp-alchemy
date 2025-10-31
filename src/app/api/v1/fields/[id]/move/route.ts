/**
 * Field Move API Routes
 *
 * PUT /api/v1/fields/[id]/move - Move field to different section
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne, transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Field, MoveFieldRequest } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/v1/fields/[id]/move
 *
 * Move field to a different section
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as MoveFieldRequest;

    // Validate request
    if (!body.section_id || typeof body.section_id !== 'string') {
      throw new ValidationError('section_id is required');
    }

    // Check field exists and belongs to user's company
    const existingField = await queryOne<Field & { company_id: string; blueprint_id: string }>(
      `SELECT f.*, b.company_id, b.id as blueprint_id
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE f.id = $1`,
      [id]
    );

    if (!existingField) {
      throw new NotFoundError('Field');
    }

    if (existingField.company_id !== user.company_id) {
      throw new NotFoundError('Field');
    }

    // Check target section exists and belongs to same blueprint
    const targetSection = await queryOne<{ id: string; blueprint_id: string }>(
      `SELECT id, blueprint_id
       FROM sections
       WHERE id = $1`,
      [body.section_id]
    );

    if (!targetSection) {
      throw new NotFoundError('Target section');
    }

    if (targetSection.blueprint_id !== existingField.blueprint_id) {
      throw new ValidationError('Target section must belong to the same blueprint');
    }

    // If moving to the same section, no-op
    if (existingField.section_id === body.section_id) {
      return NextResponse.json<SuccessResponse<Field>>({
        ok: true,
        data: existingField as Field,
      });
    }

    // Move field to new section
    const updatedField = await transaction(async (client) => {
      // Get max order_index in target section
      const maxOrderResult = await client.query(
        `SELECT MAX(order_index) as max_order
         FROM fields
         WHERE section_id = $1`,
        [body.section_id]
      );

      const maxOrderRow = maxOrderResult.rows[0] as { max_order: number | null } | undefined;
      const newOrderIndex = (maxOrderRow?.max_order ?? -1) + 1;

      // Update field's section_id and order_index
      const updateResult = await client.query(
        `UPDATE fields
         SET section_id = $1, order_index = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [body.section_id, newOrderIndex, id]
      );

      return updateResult.rows[0] as Field;
    });

    if (!updatedField) {
      throw new Error('Failed to move field');
    }

    logger.info('Moved field to different section', {
      field_id: id,
      old_section_id: existingField.section_id,
      new_section_id: body.section_id,
      new_order_index: updatedField.order_index,
    });

    return NextResponse.json<SuccessResponse<Field>>({
      ok: true,
      data: updatedField,
    });
  } catch (error) {
    return handleError(error);
  }
}
