/**
 * Session Tokens Metadata API Route
 *
 * GET /api/v1/sessions/[id]/tokens - Get all available tokens for this session
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import {
  TokenMetadataResponse,
  FieldTokenMetadata,
  SectionTokenMetadata,
  NotesTokenMetadata,
} from '@/features/artifacts/types/tokens';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type Session = {
  id: string;
  company_id: string;
  blueprint_id: string;
};

type FieldRow = {
  id: string;
  key: string;
  label: string;
  type: 'ShortText' | 'LongText' | 'Toggle';
  required: boolean;
  section_id: string;
  section_title: string;
  value: string | null;
};

type SectionRow = {
  id: string;
  title: string;
  field_count: number;
};

type NoteRow = {
  section_id: string;
  section_title: string;
  has_content: boolean;
};

/**
 * GET /api/v1/sessions/[id]/tokens
 *
 * Returns all available tokens for the session (fields, sections, notes)
 * Used by the token picker UI to show available tokens
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id: sessionId } = await context.params;

    logger.info('Fetching token metadata', { sessionId, userId: user.id });

    // Verify session exists and belongs to company
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [sessionId, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Fetch field tokens (all fields with their current values)
    const fields = await query<FieldRow>(
      `SELECT
        f.id,
        f.key,
        f.label,
        f.type,
        f.required,
        f.section_id,
        s.title as section_title,
        sfv.value
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       LEFT JOIN session_field_values sfv ON sfv.field_id = f.id AND sfv.session_id = $1
       WHERE s.blueprint_id = $2
       ORDER BY s.order_index, f.order_index`,
      [sessionId, session.blueprint_id]
    );

    // Fetch section tokens (all sections with field counts)
    const sections = await query<SectionRow>(
      `SELECT
        s.id,
        s.title,
        COUNT(f.id)::int as field_count
       FROM sections s
       LEFT JOIN fields f ON f.section_id = s.id
       WHERE s.blueprint_id = $1
       GROUP BY s.id, s.title, s.order_index
       ORDER BY s.order_index`,
      [session.blueprint_id]
    );

    // Fetch notes tokens (sections with notes)
    const notes = await query<NoteRow>(
      `SELECT
        s.id as section_id,
        s.title as section_title,
        CASE
          WHEN sn.markdown IS NOT NULL AND sn.markdown != '' THEN true
          ELSE false
        END as has_content
       FROM sections s
       LEFT JOIN section_notes sn ON sn.section_id = s.id AND sn.session_id = $1
       WHERE s.blueprint_id = $2
       ORDER BY s.order_index`,
      [sessionId, session.blueprint_id]
    );

    // Transform to token metadata format
    const fieldTokens: FieldTokenMetadata[] = fields.map((f) => ({
      token: `{{field:${f.key}}}`,
      label: f.label,
      type: f.type,
      value: f.value,
      sectionTitle: f.section_title,
      sectionId: f.section_id,
      fieldKey: f.key,
      required: f.required,
    }));

    const sectionTokens: SectionTokenMetadata[] = sections.map((s) => ({
      token: `{{section:${s.id}}}`,
      label: s.title,
      sectionId: s.id,
      fieldCount: s.field_count,
      hasFields: s.field_count > 0,
    }));

    const notesTokens: NotesTokenMetadata[] = notes.map((n) => ({
      token: `{{notes:${n.section_id}}}`,
      label: `${n.section_title} Notes`,
      sectionId: n.section_id,
      hasContent: n.has_content,
    }));

    const response: TokenMetadataResponse = {
      fields: fieldTokens,
      sections: sectionTokens,
      notes: notesTokens,
      legacy: {
        fields_json: {
          token: '{{fields_json}}',
          label: 'All Fields (JSON)',
        },
        notes_json: {
          token: '{{notes_json}}',
          label: 'All Notes (JSON)',
        },
      },
    };

    logger.info('Token metadata fetched successfully', {
      sessionId,
      fieldCount: fieldTokens.length,
      sectionCount: sectionTokens.length,
      notesCount: notesTokens.length,
    });

    return NextResponse.json<SuccessResponse<TokenMetadataResponse>>({
      ok: true,
      data: response,
    });
  } catch (error) {
    return handleError(error);
  }
}
