/**
 * Field [id] API Routes
 *
 * PUT    /api/v1/fields/[id] - Update field
 * DELETE /api/v1/fields/[id] - Delete field
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Field, UpdateFieldRequest } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/v1/fields/[id]
 *
 * Update field properties
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as UpdateFieldRequest;

    // Check field exists and belongs to user's company
    const existing = await queryOne<Field & { company_id: string }>(
      `SELECT f.*, b.company_id
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE f.id = $1`,
      [id]
    );

    if (!existing) {
      throw new NotFoundError('Field');
    }

    if (existing.company_id !== user.company_id) {
      throw new NotFoundError('Field');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.key !== undefined) {
      if (typeof body.key !== 'string' || body.key.trim() === '') {
        throw new ValidationError('Field key cannot be empty');
      }
      updates.push(`key = $${paramIndex++}`);
      values.push(body.key.trim());
    }

    if (body.type !== undefined) {
      if (!['ShortText', 'LongText', 'Toggle'].includes(body.type)) {
        throw new ValidationError('Field type must be ShortText, LongText, or Toggle');
      }
      updates.push(`type = $${paramIndex++}`);
      values.push(body.type);
    }

    if (body.label !== undefined) {
      if (typeof body.label !== 'string' || body.label.trim() === '') {
        throw new ValidationError('Field label cannot be empty');
      }
      updates.push(`label = $${paramIndex++}`);
      values.push(body.label.trim());
    }

    if (body.help_text !== undefined) {
      updates.push(`help_text = $${paramIndex++}`);
      values.push(body.help_text?.trim() || null);
    }

    if (body.placeholder !== undefined) {
      updates.push(`placeholder = $${paramIndex++}`);
      values.push(body.placeholder?.trim() || null);
    }

    if (body.required !== undefined) {
      updates.push(`required = $${paramIndex++}`);
      values.push(body.required);
    }

    if (body.span !== undefined) {
      if (body.span !== 1 && body.span !== 2) {
        throw new ValidationError('Field span must be 1 or 2');
      }
      updates.push(`span = $${paramIndex++}`);
      values.push(body.span);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const field = await queryOne<Field>(
      `UPDATE fields
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (!field) {
      throw new Error('Failed to update field');
    }

    logger.info('Updated field', {
      field_id: id,
      fields: Object.keys(body),
    });

    return NextResponse.json<SuccessResponse<Field>>({
      ok: true,
      data: field,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/fields/[id]
 *
 * Delete field
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Check field exists and belongs to user's company
    const existing = await queryOne<Field & { company_id: string }>(
      `SELECT f.*, b.company_id
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE f.id = $1`,
      [id]
    );

    if (!existing) {
      throw new NotFoundError('Field');
    }

    if (existing.company_id !== user.company_id) {
      throw new NotFoundError('Field');
    }

    // Delete field
    await execute('DELETE FROM fields WHERE id = $1', [id]);

    logger.info('Deleted field', {
      field_id: id,
      key: existing.key,
    });

    return NextResponse.json<SuccessResponse<{ id: string }>>({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
