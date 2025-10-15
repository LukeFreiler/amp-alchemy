/**
 * Session Sources API Routes
 *
 * GET    /api/v1/sessions/[id]/sources - List all sources for session
 * POST   /api/v1/sessions/[id]/sources - Create new source (file or paste)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError, NotFoundError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { extractText } from '@/features/sources/lib/extract-text';
import { Source } from '@/features/sources/types/source';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PASTE_LENGTH = 50000; // 50k characters

/**
 * GET /api/v1/sessions/[id]/sources
 *
 * List all sources for a session
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const user = await requireAuth(['owner', 'editor']);

    // Verify session exists and belongs to user's company
    const session = await queryOne<{ company_id: string }>(
      'SELECT company_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (!session) {
      throw new NotFoundError('Session');
    }

    if (session.company_id !== user.company_id) {
      throw new NotFoundError('Session');
    }

    // Get all sources for the session
    const sources = await query<Source>(
      `SELECT * FROM sources
       WHERE session_id = $1
       ORDER BY created_at DESC`,
      [sessionId]
    );

    logger.info('Fetched sources', {
      session_id: sessionId,
      count: sources.length,
    });

    return NextResponse.json<SuccessResponse<Source[]>>({
      ok: true,
      data: sources,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/sessions/[id]/sources
 *
 * Create new source from file upload or pasted text
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const user = await requireAuth(['owner', 'editor']);

    // Verify session exists and belongs to user's company
    const session = await queryOne<{ company_id: string }>(
      'SELECT company_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (!session) {
      throw new NotFoundError('Session');
    }

    if (session.company_id !== user.company_id) {
      throw new NotFoundError('Session');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;

    if (!file && !pastedText) {
      throw new ValidationError('Either file or text is required');
    }

    if (file && pastedText) {
      throw new ValidationError('Cannot upload file and paste text simultaneously');
    }

    let source: Source;

    // Handle file upload
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError('File size exceeds 10MB limit');
      }

      // Extract text from file
      const textExtracted = await extractText(file);

      // Store source
      const newSource = await queryOne<Source>(
        `INSERT INTO sources (session_id, type, filename_or_url, text_extracted, metadata, created_by)
         VALUES ($1, 'file', $2, $3, $4, $5)
         RETURNING *`,
        [
          sessionId,
          file.name,
          textExtracted,
          JSON.stringify({ size: file.size, mimeType: file.type }),
          user.id,
        ]
      );

      if (!newSource) {
        throw new Error('Failed to create source');
      }

      source = newSource;

      logger.info('Created file source', {
        source_id: source.id,
        session_id: sessionId,
        filename: file.name,
        size: file.size,
        text_length: textExtracted.length,
      });
    }
    // Handle pasted text
    else {
      // Validate text length
      if (!pastedText || pastedText.trim() === '') {
        throw new ValidationError('Pasted text cannot be empty');
      }

      if (pastedText.length > MAX_PASTE_LENGTH) {
        throw new ValidationError('Pasted text exceeds 50,000 character limit');
      }

      // Store source
      const newSource = await queryOne<Source>(
        `INSERT INTO sources (session_id, type, filename_or_url, text_extracted, created_by)
         VALUES ($1, 'paste', NULL, $2, $3)
         RETURNING *`,
        [sessionId, pastedText, user.id]
      );

      if (!newSource) {
        throw new Error('Failed to create source');
      }

      source = newSource;

      logger.info('Created paste source', {
        source_id: source.id,
        session_id: sessionId,
        text_length: pastedText.length,
      });
    }

    return NextResponse.json<SuccessResponse<Source>>(
      {
        ok: true,
        data: source,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
