/**
 * Blueprint Generators API Route
 *
 * GET /api/v1/blueprints/[id]/generators - List generators for blueprint
 * POST /api/v1/blueprints/[id]/generators - Add generator to blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Blueprint } from '@/features/blueprints/types/blueprint';
import {
  BlueprintArtifactGenerator,
  CreateGeneratorRequest,
} from '@/features/blueprints/types/generator';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/blueprints/[id]/generators
 *
 * List all generators for a blueprint
 */
export async function GET(_request: NextRequest, context: RouteContext) {
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

    // Get generators ordered by order_index
    const generators = await query<BlueprintArtifactGenerator>(
      `SELECT * FROM blueprint_artifact_generators
       WHERE blueprint_id = $1
       ORDER BY order_index ASC`,
      [id]
    );

    return NextResponse.json<SuccessResponse<BlueprintArtifactGenerator[]>>({
      ok: true,
      data: generators,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/blueprints/[id]/generators
 *
 * Add a new generator to a blueprint
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id } = await context.params;
    const body = (await request.json()) as CreateGeneratorRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      throw new ValidationError('Generator name is required');
    }

    if (
      !body.prompt_template ||
      typeof body.prompt_template !== 'string' ||
      body.prompt_template.trim() === ''
    ) {
      throw new ValidationError('Prompt template is required');
    }

    if (!body.output_format || !['Markdown', 'HTML'].includes(body.output_format)) {
      throw new ValidationError('Output format must be Markdown or HTML');
    }

    // Check blueprint exists and belongs to user's company
    const blueprint = await queryOne<Blueprint>(
      'SELECT * FROM blueprints WHERE id = $1 AND company_id = $2',
      [id, user.company_id]
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint');
    }

    // Get max order_index for this blueprint
    const maxOrder = await queryOne<{ max: number | null }>(
      'SELECT MAX(order_index) as max FROM blueprint_artifact_generators WHERE blueprint_id = $1',
      [id]
    );

    const nextOrder = (maxOrder?.max ?? -1) + 1;

    // Create generator
    const generator = await queryOne<BlueprintArtifactGenerator>(
      `INSERT INTO blueprint_artifact_generators
       (blueprint_id, name, description, prompt_template, output_format, visible_in_data_room, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        body.name.trim(),
        body.description?.trim() || null,
        body.prompt_template.trim(),
        body.output_format,
        body.visible_in_data_room ?? true,
        nextOrder,
      ]
    );

    if (!generator) {
      throw new Error('Failed to create generator');
    }

    logger.info('Created generator', {
      generator_id: generator.id,
      blueprint_id: id,
      name: generator.name,
    });

    return NextResponse.json<SuccessResponse<BlueprintArtifactGenerator>>(
      {
        ok: true,
        data: generator,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
