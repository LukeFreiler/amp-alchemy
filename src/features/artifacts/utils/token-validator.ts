/**
 * Token Validator Utility
 *
 * Validates tokens in prompt templates against available session data.
 */

import { parseTokens, validateTokenSyntax } from './token-parser';
import { TokenResolutionData, TokenValidationError, TokenValidationResult } from '../types/tokens';

/**
 * Validate all tokens in a template against session data
 *
 * @param template - Prompt template with tokens
 * @param data - Session data to validate against
 * @returns Validation result with any errors found
 */
export function validateTokens(template: string, data: TokenResolutionData): TokenValidationResult {
  const errors: TokenValidationError[] = [];

  // First check syntax
  const syntaxCheck = validateTokenSyntax(template);
  if (!syntaxCheck.valid) {
    syntaxCheck.errors.forEach((msg) => {
      errors.push({
        token: '(syntax error)',
        type: 'field',
        message: msg,
      });
    });
  }

  // Parse tokens
  const tokens = parseTokens(template);

  // Validate each token
  tokens.forEach((token) => {
    const error = validateToken(token.type, token.key, data);
    if (error) {
      errors.push(error);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single token
 */
function validateToken(
  type: 'field' | 'section' | 'notes' | 'fields_json' | 'notes_json',
  key: string,
  data: TokenResolutionData
): TokenValidationError | null {
  switch (type) {
    case 'field':
      return validateFieldToken(key, data);
    case 'section':
      return validateSectionToken(key, data);
    case 'notes':
      return validateNotesToken(key, data);
    case 'fields_json':
    case 'notes_json':
      // Legacy tokens are always valid
      return null;
    default:
      return {
        token: `{{${type}:${key}}}`,
        type: 'field',
        message: `Unknown token type: ${type}`,
      };
  }
}

/**
 * Validate a field token
 */
function validateFieldToken(fieldKey: string, data: TokenResolutionData): TokenValidationError | null {
  const field = data.fields.find((f) => f.key === fieldKey);

  if (!field) {
    // Suggest similar field keys using Levenshtein distance
    const suggestions = findSimilarKeys(
      fieldKey,
      data.fields.map((f) => f.key)
    );

    return {
      token: `{{field:${fieldKey}}}`,
      type: 'field',
      message: `Field not found: ${fieldKey}`,
      suggestions: suggestions.length > 0 ? suggestions.map((key) => `{{field:${key}}}`) : undefined,
    };
  }

  return null;
}

/**
 * Validate a section token
 */
function validateSectionToken(sectionId: string, data: TokenResolutionData): TokenValidationError | null {
  const section = data.sections.find((s) => s.id === sectionId);

  if (!section) {
    const suggestions = findSimilarKeys(
      sectionId,
      data.sections.map((s) => s.id)
    );

    return {
      token: `{{section:${sectionId}}}`,
      type: 'section',
      message: `Section not found: ${sectionId}`,
      suggestions: suggestions.length > 0 ? suggestions.map((id) => `{{section:${id}}}`) : undefined,
    };
  }

  return null;
}

/**
 * Validate a notes token
 */
function validateNotesToken(sectionId: string, data: TokenResolutionData): TokenValidationError | null {
  const section = data.sections.find((s) => s.id === sectionId);

  if (!section) {
    const suggestions = findSimilarKeys(
      sectionId,
      data.sections.map((s) => s.id)
    );

    return {
      token: `{{notes:${sectionId}}}`,
      type: 'notes',
      message: `Section not found: ${sectionId}`,
      suggestions: suggestions.length > 0 ? suggestions.map((id) => `{{notes:${id}}}`) : undefined,
    };
  }

  return null;
}

/**
 * Find similar keys using simple string similarity
 *
 * @param target - Target key to match
 * @param candidates - Available keys
 * @returns Up to 3 most similar keys
 */
function findSimilarKeys(target: string, candidates: string[]): string[] {
  // Calculate similarity scores
  const scored = candidates.map((candidate) => ({
    key: candidate,
    score: calculateSimilarity(target.toLowerCase(), candidate.toLowerCase()),
  }));

  // Sort by score and return top 3
  return scored
    .filter((item) => item.score > 0.3) // Minimum similarity threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.key);
}

/**
 * Calculate string similarity (simple version of Levenshtein)
 *
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score between 0 and 1
 */
function calculateSimilarity(a: string, b: string): number {
  // Quick checks
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Check for substring match
  if (a.includes(b) || b.includes(a)) {
    return 0.8;
  }

  // Count matching characters (simple approach)
  const aChars = new Set(a);
  const bChars = new Set(b);
  const intersection = new Set([...aChars].filter((char) => bChars.has(char)));

  return (intersection.size * 2) / (aChars.size + bChars.size);
}

/**
 * Check if template has any validation errors
 *
 * @param template - Prompt template
 * @param data - Session data
 * @returns True if template is valid
 */
export function isTemplateValid(template: string, data: TokenResolutionData): boolean {
  return validateTokens(template, data).valid;
}

/**
 * Get user-friendly error messages for display
 *
 * @param errors - Validation errors
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(errors: TokenValidationError[]): string[] {
  return errors.map((error) => {
    let message = `${error.token}: ${error.message}`;

    if (error.suggestions && error.suggestions.length > 0) {
      message += `\nDid you mean: ${error.suggestions.join(', ')}?`;
    }

    return message;
  });
}
