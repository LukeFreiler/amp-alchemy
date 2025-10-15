/**
 * Sections Reorder API Route
 *
 * PUT /api/v1/sections/reorder - Bulk update section order_index
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError } from '@/lib/errors';
import { transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { ReorderSectionsRequest } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * PUT /api/v1/sections/reorder
 *
 * Bulk update section order_index for drag-and-drop reordering
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const body = (await request.json()) as ReorderSectionsRequest;

    // Validate request
    if (!Array.isArray(body.sections) || body.sections.length === 0) {
      throw new ValidationError('sections array is required');
    }

    for (const section of body.sections) {
      if (!section.id || typeof section.order_index !== 'number') {
        throw new ValidationError('Each section must have id and order_index');
      }
    }

    // Update all sections in a transaction
    await transaction(async (client) => {
      for (const section of body.sections) {
        // Verify section belongs to user's company
        const checkResult = await client.query(
          `SELECT s.id FROM sections s
           JOIN blueprints b ON b.id = s.blueprint_id
           WHERE s.id = $1 AND b.company_id = $2`,
          [section.id, user.company_id]
        );

        if (checkResult.rows.length === 0) {
          throw new ValidationError(`Section ${section.id} not found or access denied`);
        }

        // Update order_index
        await client.query(
          'UPDATE sections SET order_index = $1, updated_at = NOW() WHERE id = $2',
          [section.order_index, section.id]
        );
      }
    });

    logger.info('Reordered sections', {
      count: body.sections.length,
      section_ids: body.sections.map((s) => s.id),
    });

    return NextResponse.json<SuccessResponse<{ updated: number }>>({
      ok: true,
      data: { updated: body.sections.length },
    });
  } catch (error) {
    return handleError(error);
  }
}
