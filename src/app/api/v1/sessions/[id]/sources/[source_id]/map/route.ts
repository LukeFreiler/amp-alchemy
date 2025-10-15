/**
 * Source Mapping API Route
 *
 * POST /api/v1/sessions/[id]/sources/[source_id]/map - Trigger AI semantic mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError } from '@/lib/errors';
import { query, queryOne, execute } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { mapSourceToFields } from '@/lib/ai/openai-client';
import { FieldCatalogEntry } from '@/features/ai/types/mapping';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type Field = {
  id: string;
  section_id: string;
  key: string;
  type: string;
  label: string;
  help_text: string | null;
  order_index: number;
};

type Section = {
  id: string;
  blueprint_id: string;
  order_index: number;
  title: string;
  description: string | null;
};

type Source = {
  id: string;
  session_id: string;
  type: string;
  filename_or_url: string | null;
  text_extracted: string;
};

/**
 * POST /api/v1/sessions/[id]/sources/[source_id]/map
 *
 * Trigger AI semantic mapping of source content to blueprint fields
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; source_id: string }> }
) {
  try {
    const { id: sessionId, source_id: sourceId } = await params;
    const user = await requireAuth(['owner', 'editor']);

    // Verify session exists and belongs to user's company
    const session = await queryOne<{ company_id: string; blueprint_id: string }>(
      'SELECT company_id, blueprint_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (!session) {
      throw new NotFoundError('Session');
    }

    if (session.company_id !== user.company_id) {
      throw new NotFoundError('Session');
    }

    // Verify source exists and belongs to session
    const source = await queryOne<Source>(
      'SELECT * FROM sources WHERE id = $1 AND session_id = $2',
      [sourceId, sessionId]
    );

    if (!source) {
      throw new NotFoundError('Source');
    }

    // Fetch blueprint structure (sections and fields)
    const sections = await query<Section>(
      'SELECT * FROM sections WHERE blueprint_id = $1 ORDER BY order_index',
      [session.blueprint_id]
    );

    const fields = await query<Field>(
      `SELECT f.* FROM fields f
       JOIN sections s ON s.id = f.section_id
       WHERE s.blueprint_id = $1
       ORDER BY s.order_index, f.order_index`,
      [session.blueprint_id]
    );

    // Build field catalog with section context
    const fieldsCatalog: FieldCatalogEntry[] = fields.map((field) => {
      const section = sections.find((s) => s.id === field.section_id);
      return {
        key: field.key,
        label: field.label,
        help_text: field.help_text,
        type: field.type,
        section: section?.title || 'Unknown Section',
      };
    });

    logger.info('Starting AI field mapping', {
      session_id: sessionId,
      source_id: sourceId,
      fields_count: fields.length,
      sections_count: sections.length,
    });

    // Run AI mapping
    const result = await mapSourceToFields(source.text_extracted, fieldsCatalog);

    // Store suggestions in database
    let suggestionsStored = 0;
    for (const suggestion of result.suggestions) {
      const field = fields.find((f) => f.key === suggestion.field_key);
      if (!field) {
        logger.warn('Suggestion for unknown field key', {
          field_key: suggestion.field_key,
        });
        continue;
      }

      // Insert or skip if field already has a value
      const inserted = await execute(
        `INSERT INTO session_field_values (session_id, field_id, value, source_provenance, confidence, reviewed)
         VALUES ($1, $2, $3, $4, $5, false)
         ON CONFLICT (session_id, field_id) DO NOTHING`,
        [
          sessionId,
          field.id,
          suggestion.value,
          JSON.stringify({
            source_id: sourceId,
            offset: suggestion.provenance.offset,
          }),
          suggestion.confidence,
        ]
      );

      if (inserted > 0) {
        suggestionsStored++;
      }
    }

    // Append unmapped summaries to section notes
    let summariesAppended = 0;
    for (const [sectionTitle, summary] of Object.entries(
      result.unmapped_summary_by_section
    )) {
      const section = sections.find((s) => s.title === sectionTitle);
      if (!section || !summary.trim()) {
        continue;
      }

      // Get existing notes or create new
      const existingNote = await queryOne<{ markdown: string }>(
        'SELECT markdown FROM section_notes WHERE session_id = $1 AND section_id = $2',
        [sessionId, section.id]
      );

      const sourceLabel = source.filename_or_url || 'Pasted Text';
      const newContent = `## From Source: ${sourceLabel}\n\n${summary}`;
      const updatedMarkdown = existingNote
        ? `${existingNote.markdown}\n\n${newContent}`
        : newContent;

      const provenanceTags = JSON.stringify([
        { source_id: sourceId, tag: sourceLabel },
      ]);

      await execute(
        `INSERT INTO section_notes (session_id, section_id, markdown, provenance_tags)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (session_id, section_id) DO UPDATE
         SET markdown = $3,
             provenance_tags = section_notes.provenance_tags || $4::jsonb,
             updated_at = NOW()`,
        [sessionId, section.id, updatedMarkdown, provenanceTags]
      );

      summariesAppended++;
    }

    logger.info('AI field mapping completed', {
      session_id: sessionId,
      source_id: sourceId,
      suggestions_stored: suggestionsStored,
      summaries_appended: summariesAppended,
    });

    return NextResponse.json<
      SuccessResponse<{
        suggestions_count: number;
        suggestions_stored: number;
        summaries_appended: number;
      }>
    >({
      ok: true,
      data: {
        suggestions_count: result.suggestions.length,
        suggestions_stored: suggestionsStored,
        summaries_appended: summariesAppended,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
