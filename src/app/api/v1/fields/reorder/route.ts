/**
 * Fields Reorder API Route
 *
 * PUT /api/v1/fields/reorder - Bulk update field order_index
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError } from '@/lib/errors';
import { transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { ReorderFieldsRequest } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * PUT /api/v1/fields/reorder
 *
 * Bulk update field order_index for drag-and-drop reordering
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const body = (await request.json()) as ReorderFieldsRequest;

    // Validate request
    if (!Array.isArray(body.fields) || body.fields.length === 0) {
      throw new ValidationError('fields array is required');
    }

    for (const field of body.fields) {
      if (!field.id || typeof field.order_index !== 'number') {
        throw new ValidationError('Each field must have id and order_index');
      }
    }

    // Update all fields in a transaction
    await transaction(async (client) => {
      for (const field of body.fields) {
        // Verify field belongs to user's company
        const checkResult = await client.query(
          `SELECT f.id FROM fields f
           JOIN sections s ON s.id = f.section_id
           JOIN blueprints b ON b.id = s.blueprint_id
           WHERE f.id = $1 AND b.company_id = $2`,
          [field.id, user.company_id]
        );

        if (checkResult.rows.length === 0) {
          throw new ValidationError(`Field ${field.id} not found or access denied`);
        }

        // Update order_index
        await client.query(
          'UPDATE fields SET order_index = $1, updated_at = NOW() WHERE id = $2',
          [field.order_index, field.id]
        );
      }
    });

    logger.info('Reordered fields', {
      count: body.fields.length,
      field_ids: body.fields.map((f) => f.id),
    });

    return NextResponse.json<SuccessResponse<{ updated: number }>>({
      ok: true,
      data: { updated: body.fields.length },
    });
  } catch (error) {
    return handleError(error);
  }
}
