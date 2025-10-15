/**
 * Artifact Generation API Route
 *
 * POST /api/v1/sessions/[id]/artifacts/generate - Generate artifact preview
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, NotFoundError, ValidationError } from '@/lib/errors';
import { query, queryOne } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { generateArtifact } from '@/lib/ai/openai-client';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type ErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: string[];
  };
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type GenerateRequest = {
  generator_id: string;
};

type GenerateResponse = {
  generator_id: string;
  generator_name: string;
  markdown: string;
  prompt: string;
  prompt_hash: string;
};

type Field = {
  key: string;
  label: string;
  value: string | null;
};

type Note = {
  title: string;
  markdown: string | null;
};

type Generator = {
  id: string;
  name: string;
  prompt_template: string;
};

type Session = {
  id: string;
  blueprint_id: string;
  company_id: string;
};

type MissingField = {
  label: string;
};

/**
 * POST /api/v1/sessions/[id]/artifacts/generate
 *
 * Generate artifact preview from session data and generator template
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(['owner', 'editor']);
    const { id: sessionId } = await context.params;
    const body = (await request.json()) as GenerateRequest;

    if (!body.generator_id) {
      throw new ValidationError('generator_id is required');
    }

    // Fetch session
    const session = await queryOne<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND company_id = $2',
      [sessionId, user.company_id]
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Fetch generator
    const generator = await queryOne<Generator>(
      'SELECT * FROM blueprint_artifact_generators WHERE id = $1',
      [body.generator_id]
    );

    if (!generator) {
      throw new NotFoundError('Generator not found');
    }

    // Check for missing required fields
    const missingFields = await query<MissingField>(
      `SELECT f.label
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       LEFT JOIN session_field_values sfv ON sfv.field_id = f.id AND sfv.session_id = $1
       WHERE s.blueprint_id = $2 AND f.required = true AND (sfv.value IS NULL OR sfv.value = '')
       ORDER BY s.order_index, f.order_index`,
      [sessionId, session.blueprint_id]
    );

    if (missingFields.length > 0) {
      logger.warn('Missing required fields for artifact generation', {
        session_id: sessionId,
        missing_count: missingFields.length,
      });

      return NextResponse.json<ErrorResponse>(
        {
          ok: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Some required fields are missing',
            fields: missingFields.map((f) => f.label),
          },
        },
        { status: 400 }
      );
    }

    // Gather field values
    const fields = await query<Field>(
      `SELECT f.key, f.label, sfv.value
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       LEFT JOIN session_field_values sfv ON sfv.field_id = f.id AND sfv.session_id = $1
       WHERE s.blueprint_id = $2
       ORDER BY s.order_index, f.order_index`,
      [sessionId, session.blueprint_id]
    );

    const fieldsJson = fields.reduce(
      (acc, f) => {
        acc[f.key] = f.value || '';
        return acc;
      },
      {} as Record<string, string>
    );

    // Gather section notes
    const notes = await query<Note>(
      `SELECT s.title, sn.markdown
       FROM section_notes sn
       JOIN sections s ON s.id = sn.section_id
       WHERE sn.session_id = $1
       ORDER BY s.order_index`,
      [sessionId]
    );

    const notesJson = notes.reduce(
      (acc, n) => {
        acc[n.title] = n.markdown || '';
        return acc;
      },
      {} as Record<string, string>
    );

    // Render template
    let prompt = generator.prompt_template;
    prompt = prompt.replace(
      /\{\{fields_json\}\}/g,
      JSON.stringify(fieldsJson, null, 2)
    );
    prompt = prompt.replace(
      /\{\{notes_json\}\}/g,
      JSON.stringify(notesJson, null, 2)
    );

    logger.info('Generating artifact', {
      session_id: sessionId,
      generator_id: body.generator_id,
      generator_name: generator.name,
      fields_count: fields.length,
      notes_count: notes.length,
    });

    // Generate with OpenAI
    const markdown = await generateArtifact(prompt);

    // Calculate prompt hash
    const promptHash = crypto
      .createHash('sha256')
      .update(generator.prompt_template)
      .digest('hex');

    logger.info('Artifact generated successfully', {
      session_id: sessionId,
      generator_id: body.generator_id,
      output_length: markdown.length,
    });

    // Return preview (not saved yet)
    return NextResponse.json<SuccessResponse<GenerateResponse>>({
      ok: true,
      data: {
        generator_id: body.generator_id,
        generator_name: generator.name,
        markdown,
        prompt,
        prompt_hash: promptHash,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
