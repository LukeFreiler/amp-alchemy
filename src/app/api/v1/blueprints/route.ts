/**
 * Blueprints API Routes
 *
 * GET    /api/v1/blueprints      - List all blueprints for user's company
 * POST   /api/v1/blueprints      - Create new blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, ConflictError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Blueprint, CreateBlueprintRequest } from '@/features/blueprints/types/blueprint';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * GET /api/v1/blueprints
 *
 * List all blueprints for the user's company with section count
 * All authenticated users can view blueprints
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const blueprints = await query<Blueprint>(
      `SELECT
        b.id,
        b.company_id,
        b.name,
        b.description,
        b.status,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT s.id)::int as section_count,
        COUNT(f.id)::int as field_count
       FROM blueprints b
       LEFT JOIN sections s ON s.blueprint_id = b.id
       LEFT JOIN fields f ON f.section_id = s.id
       WHERE b.company_id = $1
       GROUP BY b.id, b.company_id, b.name, b.description, b.status, b.created_at, b.updated_at
       ORDER BY b.updated_at DESC`,
      [user.company_id]
    );

    logger.info('Fetched blueprints', {
      company_id: user.company_id,
      count: blueprints.length,
    });

    return NextResponse.json<SuccessResponse<Blueprint[]>>({
      ok: true,
      data: blueprints,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/blueprints
 *
 * Create new blueprint (draft status)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const body = (await request.json()) as CreateBlueprintRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      throw new ValidationError('Blueprint name is required');
    }

    // Check for duplicate name in company
    const existing = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM blueprints WHERE company_id = $1 AND name = $2',
      [user.company_id, body.name.trim()]
    );

    if (existing && existing.count > 0) {
      throw new ConflictError('A blueprint with this name already exists');
    }

    // Create blueprint
    const blueprint = await queryOne<Blueprint>(
      `INSERT INTO blueprints (company_id, name, description, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING *`,
      [user.company_id, body.name.trim(), body.description?.trim() || null]
    );

    if (!blueprint) {
      throw new Error('Failed to create blueprint');
    }

    logger.info('Created blueprint', {
      blueprint_id: blueprint.id,
      company_id: user.company_id,
      name: blueprint.name,
    });

    return NextResponse.json<SuccessResponse<Blueprint>>(
      {
        ok: true,
        data: blueprint,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
