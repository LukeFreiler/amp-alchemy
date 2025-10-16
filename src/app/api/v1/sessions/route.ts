/**
 * Sessions API Routes
 *
 * GET    /api/v1/sessions      - List all sessions for user's company
 * POST   /api/v1/sessions      - Create new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, ConflictError, NotFoundError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Session, CreateSessionRequest } from '@/features/sessions/types/session';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * GET /api/v1/sessions
 *
 * List all sessions for the user's company
 * All authenticated users can view sessions
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const sessions = await query<Session>(
      `SELECT
        s.*,
        b.name as blueprint_name
       FROM sessions s
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE s.company_id = $1
       ORDER BY s.updated_at DESC`,
      [user.company_id]
    );

    logger.info('Fetched sessions', {
      company_id: user.company_id,
      count: sessions.length,
    });

    return NextResponse.json<SuccessResponse<Session[]>>({
      ok: true,
      data: sessions,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/sessions
 *
 * Create new session
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const body = (await request.json()) as CreateSessionRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      throw new ValidationError('Session name is required');
    }

    if (!body.blueprint_id || typeof body.blueprint_id !== 'string') {
      throw new ValidationError('Blueprint ID is required');
    }

    // Fetch blueprint and verify it exists and is published
    const blueprint = await queryOne<{ id: string; status: string }>(
      'SELECT id, status FROM blueprints WHERE id = $1 AND company_id = $2',
      [body.blueprint_id, user.company_id]
    );

    if (!blueprint) {
      throw new NotFoundError('Blueprint not found');
    }

    if (blueprint.status !== 'published') {
      throw new ValidationError('Can only create sessions from published blueprints');
    }

    // Check for duplicate name in company
    const existing = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM sessions WHERE company_id = $1 AND name = $2',
      [user.company_id, body.name.trim()]
    );

    if (existing && existing.count > 0) {
      throw new ConflictError('A session with this name already exists');
    }

    // Create session
    const session = await queryOne<Session>(
      `INSERT INTO sessions (company_id, blueprint_id, name, status, created_by)
       VALUES ($1, $2, $3, 'in_progress', $4)
       RETURNING *`,
      [user.company_id, blueprint.id, body.name.trim(), user.id]
    );

    if (!session) {
      throw new Error('Failed to create session');
    }

    logger.info('Created session', {
      session_id: session.id,
      company_id: user.company_id,
      blueprint_id: blueprint.id,
      name: session.name,
    });

    return NextResponse.json<SuccessResponse<Session>>(
      {
        ok: true,
        data: session,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
