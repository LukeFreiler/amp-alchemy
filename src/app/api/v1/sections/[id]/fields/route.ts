/**
 * Section Fields API Route
 *
 * POST /api/v1/sections/[id]/fields - Add field to section
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Section, Field, CreateFieldRequest } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/v1/sections/[id]/fields
 *
 * Add a new field to a section
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as CreateFieldRequest;

    // Validate required fields
    if (!body.key || typeof body.key !== 'string' || body.key.trim() === '') {
      throw new ValidationError('Field key is required');
    }

    if (!body.label || typeof body.label !== 'string' || body.label.trim() === '') {
      throw new ValidationError('Field label is required');
    }

    if (!body.type || !['ShortText', 'LongText', 'Toggle'].includes(body.type)) {
      throw new ValidationError('Field type must be ShortText, LongText, or Toggle');
    }

    if (body.span !== 1 && body.span !== 2) {
      throw new ValidationError('Field span must be 1 or 2');
    }

    // Check section exists and belongs to user's company
    const section = await queryOne<Section & { company_id: string }>(
      `SELECT s.*, b.company_id
       FROM sections s
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE s.id = $1`,
      [id]
    );

    if (!section) {
      throw new NotFoundError('Section');
    }

    if (section.company_id !== user.company_id) {
      throw new NotFoundError('Section');
    }

    // Get max order_index for this section
    const maxOrder = await queryOne<{ max: number | null }>(
      'SELECT MAX(order_index) as max FROM fields WHERE section_id = $1',
      [id]
    );

    const nextOrder = (maxOrder?.max ?? -1) + 1;

    // Create field
    const field = await queryOne<Field>(
      `INSERT INTO fields (section_id, key, type, label, help_text, placeholder, required, span, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        body.key.trim(),
        body.type,
        body.label.trim(),
        body.help_text?.trim() || null,
        body.placeholder?.trim() || null,
        body.required ?? false,
        body.span,
        nextOrder,
      ]
    );

    if (!field) {
      throw new Error('Failed to create field');
    }

    logger.info('Created field', {
      field_id: field.id,
      section_id: id,
      key: field.key,
    });

    return NextResponse.json<SuccessResponse<Field>>(
      {
        ok: true,
        data: field,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
