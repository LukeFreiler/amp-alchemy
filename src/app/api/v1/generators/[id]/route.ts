/**
 * Generator API Route
 *
 * PUT /api/v1/generators/[id] - Update generator
 * DELETE /api/v1/generators/[id] - Delete generator
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import {
  BlueprintArtifactGenerator,
  UpdateGeneratorRequest,
} from '@/features/blueprints/types/generator';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/v1/generators/[id]
 *
 * Update an existing generator
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as UpdateGeneratorRequest;

    // Validate output_format if provided
    if (body.output_format && !['Markdown', 'HTML'].includes(body.output_format)) {
      throw new ValidationError('Output format must be Markdown or HTML');
    }

    // Check generator exists and belongs to user's company
    const existingGenerator = await queryOne<BlueprintArtifactGenerator & { company_id: string }>(
      `SELECT g.*, b.company_id
       FROM blueprint_artifact_generators g
       JOIN blueprints b ON g.blueprint_id = b.id
       WHERE g.id = $1`,
      [id]
    );

    if (!existingGenerator || existingGenerator.company_id !== user.company_id) {
      throw new NotFoundError('Generator');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        throw new ValidationError('Generator name cannot be empty');
      }
      updates.push(`name = $${paramCount++}`);
      values.push(body.name.trim());
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(body.description?.trim() || null);
    }

    if (body.prompt_template !== undefined) {
      if (typeof body.prompt_template !== 'string' || body.prompt_template.trim() === '') {
        throw new ValidationError('Prompt template cannot be empty');
      }
      updates.push(`prompt_template = $${paramCount++}`);
      values.push(body.prompt_template.trim());
    }

    if (body.output_format !== undefined) {
      updates.push(`output_format = $${paramCount++}`);
      values.push(body.output_format);
    }

    if (body.visible_in_data_room !== undefined) {
      updates.push(`visible_in_data_room = $${paramCount++}`);
      values.push(body.visible_in_data_room);
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const generator = await queryOne<BlueprintArtifactGenerator>(
      `UPDATE blueprint_artifact_generators
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (!generator) {
      throw new Error('Failed to update generator');
    }

    logger.info('Updated generator', {
      generator_id: id,
      updates: Object.keys(body),
    });

    return NextResponse.json<SuccessResponse<BlueprintArtifactGenerator>>({
      ok: true,
      data: generator,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/v1/generators/[id]
 *
 * Delete a generator (only if no artifacts reference it)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;

    // Check generator exists and belongs to user's company
    const existingGenerator = await queryOne<BlueprintArtifactGenerator & { company_id: string }>(
      `SELECT g.*, b.company_id
       FROM blueprint_artifact_generators g
       JOIN blueprints b ON g.blueprint_id = b.id
       WHERE g.id = $1`,
      [id]
    );

    if (!existingGenerator || existingGenerator.company_id !== user.company_id) {
      throw new NotFoundError('Generator');
    }

    // Check if any artifacts reference this generator
    const artifactCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM artifacts WHERE generator_id = $1',
      [id]
    );

    if (artifactCount && artifactCount.count > 0) {
      throw new ConflictError(
        'Cannot delete generator: artifacts exist that reference this generator'
      );
    }

    // Delete generator
    await execute('DELETE FROM blueprint_artifact_generators WHERE id = $1', [id]);

    logger.info('Deleted generator', {
      generator_id: id,
    });

    return NextResponse.json<SuccessResponse<{ id: string }>>({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
