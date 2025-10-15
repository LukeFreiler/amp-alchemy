/**
 * Share Link Sources API Routes
 *
 * POST   /api/v1/share/[token]/sources - Upload source as viewer
 */

import { NextRequest, NextResponse } from 'next/server';

import { queryOne } from '@/lib/db/query';
import { handleError, ValidationError, NotFoundError, AuthorizationError } from '@/lib/errors';
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
 * POST /api/v1/share/[token]/sources
 *
 * Upload source as viewer (no authentication required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Fetch share link and verify it allows uploads
    const shareLink = await queryOne<{
      id: string;
      artifact_id: string;
      allow_source_upload: boolean;
      expires_at: string | null;
    }>(
      `SELECT id, artifact_id, allow_source_upload, expires_at
       FROM share_links
       WHERE token = $1`,
      [token]
    );

    if (!shareLink) {
      throw new NotFoundError('Share link');
    }

    // Check expiration
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'EXPIRED',
            message: 'This share link has expired',
          },
        },
        { status: 410 }
      );
    }

    // Check if uploads are allowed
    if (!shareLink.allow_source_upload) {
      throw new AuthorizationError('Source uploads are not allowed on this share link');
    }

    // Get session_id from artifact
    const artifact = await queryOne<{ session_id: string }>(
      'SELECT session_id FROM artifacts WHERE id = $1',
      [shareLink.artifact_id]
    );

    if (!artifact) {
      throw new NotFoundError('Artifact');
    }

    const sessionId = artifact.session_id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;

    // Validate that exactly one input type is provided
    const inputCount = [file, pastedText].filter(Boolean).length;
    if (inputCount === 0) {
      throw new ValidationError('Either file or text is required');
    }
    if (inputCount > 1) {
      throw new ValidationError('Cannot provide multiple input types simultaneously');
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

      // Store source (created_by is NULL for viewer uploads)
      const newSource = await queryOne<Source>(
        `INSERT INTO sources (session_id, type, filename_or_url, text_extracted, metadata, created_by)
         VALUES ($1, 'file', $2, $3, $4, NULL)
         RETURNING *`,
        [
          sessionId,
          file.name,
          textExtracted,
          JSON.stringify({ size: file.size, mimeType: file.type }),
        ]
      );

      if (!newSource) {
        throw new Error('Failed to create source');
      }

      source = newSource;

      logger.info('Created viewer file source', {
        source_id: source.id,
        session_id: sessionId,
        share_token: token,
        filename: file.name,
        size: file.size,
        text_length: textExtracted.length,
      });
    }
    // Handle pasted text
    else if (pastedText) {
      // Validate text length
      if (pastedText.trim() === '') {
        throw new ValidationError('Pasted text cannot be empty');
      }

      if (pastedText.length > MAX_PASTE_LENGTH) {
        throw new ValidationError('Pasted text exceeds 50,000 character limit');
      }

      // Store source (created_by is NULL for viewer uploads)
      const newSource = await queryOne<Source>(
        `INSERT INTO sources (session_id, type, filename_or_url, text_extracted, created_by)
         VALUES ($1, 'paste', NULL, $2, NULL)
         RETURNING *`,
        [sessionId, pastedText]
      );

      if (!newSource) {
        throw new Error('Failed to create source');
      }

      source = newSource;

      logger.info('Created viewer paste source', {
        source_id: source.id,
        session_id: sessionId,
        share_token: token,
        text_length: pastedText.length,
      });
    } else {
      throw new ValidationError('Either file or text is required');
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
