/**
 * Blueprint [id] API Routes
 *
 * GET    /api/v1/blueprints/[id]      - Get single blueprint with sections and fields
 * PUT    /api/v1/blueprints/[id]      - Update blueprint metadata
 * DELETE /api/v1/blueprints/[id]      - Delete blueprint (if no sessions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { query, queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import {
  Blueprint,
  Section,
  Field,
  BlueprintWithSections,
  UpdateBlueprintRequest,
} from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/blueprints/[id]
 *
 * Get single blueprint with nested sections and fields
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Fetch blueprint
    const blueprint = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint');
    }

    // Fetch sections with fields
    const sections = await query<Section>(
      'SELECT * FROM sections WHERE blueprint_id = $1 ORDER BY order_index ASC',
      [id]
    );

    const fields = await query<Field>(
      `SELECT f.* FROM fields f
       JOIN sections s ON s.id = f.section_id
       WHERE s.blueprint_id = $1
       ORDER BY f.section_id, f.order_index ASC`,
      [id]
    );

    // Group fields by section
    const sectionsWithFields = sections.map((section) => ({
      ...section,
      fields: fields.filter((field) => field.section_id === section.id),
    }));

    const result: BlueprintWithSections = {
      ...blueprint,
      sections: sectionsWithFields,
    };

    return NextResponse.json<SuccessResponse<BlueprintWithSections>>({
      ok: true,
      data: result,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/v1/blueprints/[id]
 *
 * Update blueprint metadata (name, description)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as UpdateBlueprintRequest;

    // Check blueprint exists and belongs to user's company
    const existing = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!existing) {
      throw new NotFoundError('Blueprint');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        throw new ValidationError('Blueprint name cannot be empty');
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name.trim());
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description?.trim() || null);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, user.company_id);

    const blueprint = await queryOne<Blueprint>(
      `UPDATE blueprints
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint');
    }

    logger.info('Updated blueprint', {
      blueprint_id: id,
      fields: Object.keys(body),
    });

    return NextResponse.json<SuccessResponse<Blueprint>>({
      ok: true,
      data: blueprint,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/blueprints/[id]
 *
 * Delete blueprint (only if no sessions reference it)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Check blueprint exists and belongs to user's company
    const existing = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!existing) {
      throw new NotFoundError('Blueprint');
    }

    // Check for sessions
    const sessionCheck = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM sessions WHERE blueprint_id = $1',
      [id]
    );

    if (sessionCheck && sessionCheck.count > 0) {
      throw new ValidationError('Cannot delete blueprint with existing sessions');
    }

    // Delete blueprint (cascades to sections and fields via DB constraints)
    await execute('DELETE FROM blueprints WHERE id = $1', [id]);

    logger.info('Deleted blueprint', {
      blueprint_id: id,
      name: existing.name,
    });

    return NextResponse.json<SuccessResponse<{ id: string }>>({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
