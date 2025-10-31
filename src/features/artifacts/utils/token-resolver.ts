/**
 * Token Resolver Utility
 *
 * Resolves tokens in prompt templates to their actual values from session data.
 */

import { parseTokens, escapeLiteralBraces, restoreEscapedBraces } from './token-parser';
import { TokenResolutionData } from '../types/tokens';
import { formatSectionFields } from './format-section';

/**
 * Resolve all tokens in a template to their actual values
 *
 * @param template - Prompt template with tokens
 * @param data - Session data for token resolution
 * @returns Resolved template with all tokens replaced
 */
export function resolveTokens(template: string, data: TokenResolutionData): string {
  // Handle escaped braces
  const processedTemplate = escapeLiteralBraces(template);

  // Parse all tokens
  const tokens = parseTokens(processedTemplate);

  // Replace tokens in reverse order to preserve positions
  let resolved = processedTemplate;
  const reversedTokens = [...tokens].reverse();

  reversedTokens.forEach((token) => {
    const value = resolveToken(token.type, token.key, data);
    resolved = resolved.slice(0, token.start) + value + resolved.slice(token.end);
  });

  // Restore escaped braces
  return restoreEscapedBraces(resolved);
}

/**
 * Resolve a single token to its value
 *
 * @param type - Token type
 * @param key - Token key (field key, section id, etc.)
 * @param data - Session data
 * @returns Resolved value or placeholder
 */
function resolveToken(
  type: 'field' | 'section' | 'notes' | 'fields_json' | 'notes_json',
  key: string,
  data: TokenResolutionData
): string {
  switch (type) {
    case 'field':
      return resolveFieldToken(key, data);
    case 'section':
      return resolveSectionToken(key, data);
    case 'notes':
      return resolveNotesToken(key, data);
    case 'fields_json':
      return resolveFieldsJsonToken(data);
    case 'notes_json':
      return resolveNotesJsonToken(data);
    default:
      return `[Unknown token type: ${type}]`;
  }
}

/**
 * Resolve a field token to its value
 */
function resolveFieldToken(fieldKey: string, data: TokenResolutionData): string {
  const field = data.fields.find((f) => f.key === fieldKey);

  if (!field) {
    return `[Field not found: ${fieldKey}]`;
  }

  // Handle empty values
  if (field.value === null || field.value === '') {
    return '';
  }

  // For toggle fields, convert boolean to readable text
  if (field.type === 'Toggle') {
    return field.value === 'true' ? 'Yes' : 'No';
  }

  return field.value;
}

/**
 * Resolve a section token to formatted field list
 */
function resolveSectionToken(sectionKey: string, data: TokenResolutionData): string {
  const section = data.sections.find((s) => s.key === sectionKey);

  if (!section) {
    return `[Section not found: ${sectionKey}]`;
  }

  const sectionFields = data.fields.filter((f) => f.sectionId === section.id);

  if (sectionFields.length === 0) {
    return `[No fields in section: ${section.title}]`;
  }

  return formatSectionFields(sectionFields);
}

/**
 * Resolve a notes token to section notes markdown
 */
function resolveNotesToken(sectionKey: string, data: TokenResolutionData): string {
  const section = data.sections.find((s) => s.key === sectionKey);

  if (!section) {
    return `[Section not found: ${sectionKey}]`;
  }

  const note = data.notes.find((n) => n.section_id === section.id);

  if (!note || !note.markdown || note.markdown.trim() === '') {
    return '(No notes)';
  }

  return note.markdown;
}

/**
 * Resolve legacy fields_json token
 */
function resolveFieldsJsonToken(data: TokenResolutionData): string {
  const fieldsObject: Record<string, string | boolean | null> = {};

  data.fields.forEach((field) => {
    // Convert toggle values to boolean
    if (field.type === 'Toggle') {
      fieldsObject[field.key] =
        field.value === 'true' ? true : field.value === 'false' ? false : null;
    } else {
      fieldsObject[field.key] = field.value;
    }
  });

  return JSON.stringify(fieldsObject, null, 2);
}

/**
 * Resolve legacy notes_json token
 */
function resolveNotesJsonToken(data: TokenResolutionData): string {
  const notesObject: Record<string, string> = {};

  data.notes.forEach((note) => {
    const section = data.sections.find((s) => s.id === note.section_id);
    if (section) {
      notesObject[section.id] = note.markdown || '';
    }
  });

  return JSON.stringify(notesObject, null, 2);
}

/**
 * Preview token resolution with highlighting for empty/missing values
 *
 * @param template - Prompt template
 * @param data - Session data
 * @returns Object with resolved template and metadata about empty/missing tokens
 */
export function resolveTokensWithMetadata(
  template: string,
  data: TokenResolutionData
): {
  resolved: string;
  emptyTokens: string[];
  missingTokens: string[];
} {
  const tokens = parseTokens(template);
  const emptyTokens: string[] = [];
  const missingTokens: string[] = [];

  tokens.forEach((token) => {
    const value = resolveToken(token.type, token.key, data);

    // Check for missing/empty values
    if (value.startsWith('[') && value.endsWith(']')) {
      missingTokens.push(token.raw);
    } else if (value === '' || value === '(No notes)') {
      emptyTokens.push(token.raw);
    }
  });

  return {
    resolved: resolveTokens(template, data),
    emptyTokens,
    missingTokens,
  };
}
