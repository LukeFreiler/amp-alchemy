/**
 * Generator Reorder API Route
 *
 * PUT /api/v1/generators/reorder - Bulk update generator order
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError } from '@/lib/errors';
import { transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { ReorderGeneratorsRequest } from '@/features/blueprints/types/generator';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * PUT /api/v1/generators/reorder
 *
 * Update order_index for multiple generators
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const body = (await request.json()) as ReorderGeneratorsRequest;

    // Validate request
    if (!Array.isArray(body.generators) || body.generators.length === 0) {
      throw new ValidationError('Generators array is required');
    }

    // Validate each generator has id and order_index
    for (const gen of body.generators) {
      if (!gen.id || typeof gen.order_index !== 'number') {
        throw new ValidationError('Each generator must have id and order_index');
      }
    }

    // Update all generators in a transaction
    await transaction(async (client) => {
      for (const gen of body.generators) {
        // Verify generator belongs to user's company before updating
        const result = await client.query(
          `UPDATE blueprint_artifact_generators g
           SET order_index = $1, updated_at = NOW()
           FROM blueprints b
           WHERE g.id = $2
           AND g.blueprint_id = b.id
           AND b.company_id = $3`,
          [gen.order_index, gen.id, user.company_id]
        );

        if (result.rowCount === 0) {
          throw new ValidationError(`Generator ${gen.id} not found or access denied`);
        }
      }
    });

    logger.info('Reordered generators', {
      count: body.generators.length,
      generator_ids: body.generators.map((g) => g.id),
    });

    return NextResponse.json<SuccessResponse<{ count: number }>>({
      ok: true,
      data: { count: body.generators.length },
    });
  } catch (error) {
    return handleError(error);
  }
}
