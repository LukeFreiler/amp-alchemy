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
import { validateTokens } from '@/features/artifacts/utils/token-validator';
import { resolveTokens } from '@/features/artifacts/utils/token-resolver';
import { TokenResolutionData } from '@/features/artifacts/types/tokens';

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

type FieldRow = {
  id: string;
  key: string;
  label: string;
  type: 'ShortText' | 'LongText' | 'Toggle';
  value: string | null;
  section_id: string;
  section_title: string;
};

type SectionRow = {
  id: string;
  title: string;
};

type NoteRow = {
  section_id: string;
  markdown: string | null;
  section_title: string;
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

    // Gather field values with section info for token resolution
    const fields = await query<FieldRow>(
      `SELECT f.id, f.key, f.label, f.type, sfv.value, f.section_id, s.title as section_title
       FROM fields f
       JOIN sections s ON s.id = f.section_id
       LEFT JOIN session_field_values sfv ON sfv.field_id = f.id AND sfv.session_id = $1
       WHERE s.blueprint_id = $2
       ORDER BY s.order_index, f.order_index`,
      [sessionId, session.blueprint_id]
    );

    // Gather sections for token resolution
    const sections = await query<SectionRow>(
      `SELECT id, title
       FROM sections
       WHERE blueprint_id = $1
       ORDER BY order_index`,
      [session.blueprint_id]
    );

    // Gather section notes
    const notes = await query<NoteRow>(
      `SELECT sn.section_id, sn.markdown, s.title as section_title
       FROM sections s
       LEFT JOIN section_notes sn ON sn.section_id = s.id AND sn.session_id = $1
       WHERE s.blueprint_id = $2
       ORDER BY s.order_index`,
      [sessionId, session.blueprint_id]
    );

    // Prepare token resolution data
    const tokenData: TokenResolutionData = {
      fields: fields.map((f) => ({
        ...f,
        sectionId: f.section_id,
        sectionTitle: f.section_title,
        help_text: null,
        placeholder: null,
        required: false,
        span: 1 as const,
        order_index: 0,
        created_at: '',
        updated_at: '',
      })),
      sections: sections.map((s) => ({
        ...s,
        blueprint_id: session.blueprint_id,
        order_index: 0,
        description: null,
        created_at: '',
        updated_at: '',
      })),
      notes: notes.map((n) => ({
        id: '',
        session_id: sessionId,
        section_id: n.section_id,
        markdown: n.markdown || '',
        sectionTitle: n.section_title,
        created_at: '',
        updated_at: '',
      })),
    };

    // Validate tokens in template
    const validation = validateTokens(generator.prompt_template, tokenData);

    if (!validation.valid) {
      logger.warn('Invalid tokens in generator template', {
        session_id: sessionId,
        generator_id: body.generator_id,
        errors: validation.errors,
      });

      return NextResponse.json<ErrorResponse>(
        {
          ok: false,
          error: {
            code: 'INVALID_TOKENS',
            message: validation.errors.map((e) => e.message).join('; '),
          },
        },
        { status: 400 }
      );
    }

    // Resolve all tokens in the template
    const prompt = resolveTokens(generator.prompt_template, tokenData);

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
    const promptHash = crypto.createHash('sha256').update(generator.prompt_template).digest('hex');

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
