/**
 * Blueprint Publish API Route
 *
 * POST /api/v1/blueprints/[id]/publish - Publish blueprint or create new version
 */

import { NextRequest, NextResponse } from 'next/server';
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

/**
 * POST /api/v1/blueprints/[id]/publish
 *
 * Publish a draft blueprint (creates version 1) OR
 * Create new version for already-published blueprint
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Check blueprint exists and belongs to user's company
    const blueprint = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint');
    }

    // Validate blueprint has at least one section
    const sectionCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM sections WHERE blueprint_id = $1',
      [id]
    );

    if (!sectionCount || sectionCount.count === 0) {
      throw new ValidationError('Blueprint must have at least one section');
    }

    // Validate blueprint has at least one field
    const fieldCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM fields f
       JOIN sections s ON s.id = f.section_id
       WHERE s.blueprint_id = $1`,
      [id]
    );

    if (!fieldCount || fieldCount.count === 0) {
      throw new ValidationError('Blueprint must have at least one field');
    }

    let result: Blueprint;

    if (blueprint.status === 'draft') {
      // Simple case: mark as published
      const updated = await queryOne<Blueprint>(
        `UPDATE blueprints
         SET status = 'published', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (!updated) {
        throw new NotFoundError('Blueprint');
      }

      result = updated;

      logger.info('Published blueprint', {
        blueprint_id: id,
        version: result.version,
      });
    } else if (blueprint.status === 'published') {
      // Complex case: create new version
      result = await transaction(async (client) => {
        // 1. Create new blueprint with incremented version
        const newBlueprintResult = await client.query(
          `INSERT INTO blueprints (company_id, name, description, version, status)
           VALUES ($1, $2, $3, $4, 'published')
           RETURNING *`,
          [blueprint.company_id, blueprint.name, blueprint.description, blueprint.version + 1]
        );

        const newBlueprintId = (newBlueprintResult.rows[0] as Blueprint).id;

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

        // 4. Archive the old version
        await client.query('UPDATE blueprints SET status = $1 WHERE id = $2', ['archived', id]);

        return newBlueprintResult.rows[0] as Blueprint;
      });

      logger.info('Created new blueprint version', {
        old_id: id,
        new_id: result.id,
        version: result.version,
      });
    } else {
      throw new ValidationError('Cannot publish archived blueprint');
    }

    return NextResponse.json<SuccessResponse<Blueprint>>({
      ok: true,
      data: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
