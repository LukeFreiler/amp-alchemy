/**
 * Blueprint Duplicate API Route
 *
 * POST /api/v1/blueprints/[id]/duplicate - Duplicate blueprint with new name
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { queryOne, transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Blueprint, Section, Field } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface DuplicateBlueprintRequest {
  name: string;
}

/**
 * POST /api/v1/blueprints/[id]/duplicate
 *
 * Duplicate a blueprint with all sections and fields
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as DuplicateBlueprintRequest;

    // Validate name
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      throw new ValidationError('Blueprint name is required');
    }

    // Check source blueprint exists
    const sourceBlueprint = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!sourceBlueprint) {
      throw new NotFoundError('Blueprint');
    }

    // Check for duplicate name
    const existing = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM blueprints WHERE company_id = $1 AND name = $2',
      [user.company_id, body.name.trim()]
    );

    if (existing && existing.count > 0) {
      throw new ValidationError('A blueprint with this name already exists');
    }

    // Duplicate blueprint with transaction
    const newBlueprint = await transaction(async (client) => {
      // 1. Create new blueprint as draft
      const blueprintResult = await client.query(
        `INSERT INTO blueprints (company_id, name, description, status)
         VALUES ($1, $2, $3, 'draft')
         RETURNING *`,
        [user.company_id, body.name.trim(), sourceBlueprint.description]
      );

      const newBlueprintId = (blueprintResult.rows[0] as Blueprint).id;

      // 2. Copy all sections
      const sectionsResult = await client.query(
        'SELECT * FROM sections WHERE blueprint_id = $1 ORDER BY order_index ASC',
        [id]
      );

      const sectionMapping = new Map<string, string>(); // old_id -> new_id

      for (const sectionRow of sectionsResult.rows) {
        const section = sectionRow as Section;
        const newSectionResult = await client.query(
          `INSERT INTO sections (blueprint_id, order_index, title, description)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [newBlueprintId, section.order_index, section.title, section.description]
        );
        sectionMapping.set(section.id, (newSectionResult.rows[0] as Section).id);
      }

      // 3. Copy all fields
      const fieldsResult = await client.query(
        `SELECT f.* FROM fields f
         JOIN sections s ON s.id = f.section_id
         WHERE s.blueprint_id = $1
         ORDER BY f.order_index ASC`,
        [id]
      );

      for (const fieldRow of fieldsResult.rows) {
        const field = fieldRow as Field;
        const newSectionId = sectionMapping.get(field.section_id);
        if (!newSectionId) continue;

        await client.query(
          `INSERT INTO fields (section_id, key, type, label, help_text, placeholder, required, span, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newSectionId,
            field.key,
            field.type,
            field.label,
            field.help_text,
            field.placeholder,
            field.required,
            field.span,
            field.order_index,
          ]
        );
      }

      return blueprintResult.rows[0] as Blueprint;
    });

    logger.info('Duplicated blueprint', {
      source_id: id,
      new_id: newBlueprint.id,
      name: body.name,
    });

    // Invalidate the blueprints list cache so it refreshes immediately
    revalidatePath('/blueprints');

    return NextResponse.json<SuccessResponse<Blueprint>>(
      {
        ok: true,
        data: newBlueprint,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
