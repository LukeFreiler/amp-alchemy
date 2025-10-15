/**
 * OpenAI Client
 *
 * Provides GPT-4o integration for semantic field mapping and artifact generation
 */

import OpenAI from 'openai';
import { MappingResult, FieldCatalogEntry } from '@/features/ai/types/mapping';
import { logger } from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Maps source text to blueprint fields using semantic understanding
 *
 * @param sourceText - Extracted text from source (file/paste/url)
 * @param fieldsCatalog - Array of fields with metadata for mapping context
 * @returns Mapping result with suggestions and unmapped summaries
 */
export async function mapSourceToFields(
  sourceText: string,
  fieldsCatalog: FieldCatalogEntry[]
): Promise<MappingResult> {
  const systemMessage = `You are a semantic field mapper. Your job is to extract values from source documents and map them to structured fields in a blueprint.

Rules:
1. Return ONLY valid JSON in the specified format
2. Prefer exact text spans from the source where possible
3. Do NOT infer or make up values that are not present in the source
4. Set confidence based on how well the extracted value matches the field semantics
5. Include character offsets [start, end] for provenance tracking
6. Summarize any relevant content that doesn't map to specific fields, organized by section`;

  const userPrompt = `Map the following source text to the blueprint fields.

Fields Catalog:
${JSON.stringify(fieldsCatalog, null, 2)}

Source Text:
${sourceText}

Return JSON in this EXACT format:
{
  "suggestions": [
    {
      "field_key": "project_name",
      "value": "extracted text value",
      "confidence": 0.85,
      "provenance": { "offset": [120, 350] }
    }
  ],
  "unmapped_summary_by_section": {
    "Section Name": "Summary of unmatched content relevant to this section..."
  }
}`;

  try {
    logger.info('Starting OpenAI field mapping', {
      source_length: sourceText.length,
      fields_count: fieldsCatalog.length,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const result = JSON.parse(content) as MappingResult;

    logger.info('OpenAI field mapping completed', {
      suggestions_count: result.suggestions.length,
      sections_with_summaries: Object.keys(result.unmapped_summary_by_section).length,
      tokens_used: response.usage?.total_tokens,
    });

    return result;
  } catch (error) {
    logger.error('OpenAI field mapping failed', { error });
    throw error;
  }
}

/**
 * Generates artifact content from a rendered prompt
 *
 * @param prompt - Fully rendered prompt with template variables replaced
 * @returns Generated markdown content
 */
export async function generateArtifact(prompt: string): Promise<string> {
  const systemMessage = `You write polished artifacts from structured context. Never fabricate missing facts. Use Markdown headings and bullets. Keep it concise and professional.`;

  try {
    logger.info('Starting artifact generation', {
      prompt_length: prompt.length,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    logger.info('Artifact generation completed', {
      output_length: content.length,
      tokens_used: response.usage?.total_tokens,
    });

    return content;
  } catch (error) {
    logger.error('Artifact generation failed', { error });
    throw error;
  }
}
