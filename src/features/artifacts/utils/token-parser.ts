/**
 * Token Parser Utility
 *
 * Parses token syntax from prompt templates and extracts structured token information.
 *
 * Supported token types:
 * - {{field:key}} - Individual field value
 * - {{section:key}} - All fields in a section formatted as text
 * - {{notes:section_key}} - Section notes markdown
 * - {{fields_json}} - Legacy: All fields as JSON
 * - {{notes_json}} - Legacy: All notes as JSON
 */

export type TokenType = 'field' | 'section' | 'notes' | 'fields_json' | 'notes_json';

export type ParsedToken = {
  type: TokenType;
  key: string; // field key, section id, or 'fields_json'/'notes_json'
  raw: string; // original token string including braces
  start: number; // position in template
  end: number; // position in template
};

// Token regex patterns
const TOKEN_PATTERNS = {
  field: /\{\{field:([a-z0-9_-]+)\}\}/gi,
  section: /\{\{section:([a-z0-9_-]+)\}\}/gi,
  notes: /\{\{notes:([a-z0-9_-]+)\}\}/gi,
  fields_json: /\{\{fields_json\}\}/gi,
  notes_json: /\{\{notes_json\}\}/gi,
};

/**
 * Extract all tokens from a prompt template
 *
 * @param template - Prompt template string
 * @returns Array of parsed tokens with type, key, and position information
 */
export function parseTokens(template: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];

  // Extract each token type
  Object.entries(TOKEN_PATTERNS).forEach(([type, pattern]) => {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(template)) !== null) {
      tokens.push({
        type: type as TokenType,
        key: match[1] || type, // Capture group or token type name for legacy tokens
        raw: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  });

  // Sort by position in template
  return tokens.sort((a, b) => a.start - b.start);
}

/**
 * Extract unique token keys grouped by type
 *
 * @param template - Prompt template string
 * @returns Object with arrays of unique keys for each token type
 */
export function extractTokenKeys(template: string): Record<TokenType, string[]> {
  const tokens = parseTokens(template);
  const keysByType: Record<TokenType, Set<string>> = {
    field: new Set(),
    section: new Set(),
    notes: new Set(),
    fields_json: new Set(),
    notes_json: new Set(),
  };

  tokens.forEach((token) => {
    keysByType[token.type].add(token.key);
  });

  // Convert sets to arrays
  return Object.fromEntries(
    Object.entries(keysByType).map(([type, keys]) => [type, Array.from(keys)])
  ) as Record<TokenType, string[]>;
}

/**
 * Check if a template contains any tokens
 *
 * @param template - Prompt template string
 * @returns True if template contains at least one token
 */
export function hasTokens(template: string): boolean {
  return Object.values(TOKEN_PATTERNS).some((pattern) => pattern.test(template));
}

/**
 * Validate token syntax (well-formed, no malformed braces)
 *
 * @param template - Prompt template string
 * @returns Validation result with any syntax errors found
 */
export function validateTokenSyntax(
  template: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for malformed tokens (opening braces without closing, etc.)
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push('Mismatched token braces: found unmatched {{ or }}');
  }

  // Find potential malformed tokens (e.g., {{field:}}, {{}}, {{:value}})
  const malformedPatterns = [
    /\{\{field:\s*\}\}/g, // Empty field key
    /\{\{section:\s*\}\}/g, // Empty section key
    /\{\{notes:\s*\}\}/g, // Empty notes key
    /\{\{\s*\}\}/g, // Empty braces
    /\{\{:[^}]+\}\}/g, // Missing type prefix
  ];

  malformedPatterns.forEach((pattern) => {
    const matches = template.match(pattern);
    if (matches) {
      errors.push(`Malformed token syntax found: ${matches.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Escape literal braces in template to prevent false token detection
 *
 * @param template - Prompt template string
 * @returns Template with escaped braces
 */
export function escapeLiteralBraces(template: string): string {
  // Replace \{\{ with a placeholder, then restore after token processing
  return template.replace(/\\\{\{/g, '{{ESCAPED_OPEN}}').replace(/\\\}\}/g, '{{ESCAPED_CLOSE}}');
}

/**
 * Restore escaped braces after token processing
 *
 * @param template - Template with escaped brace placeholders
 * @returns Template with literal braces
 */
export function restoreEscapedBraces(template: string): string {
  return template.replace(/\{\{ESCAPED_OPEN\}\}/g, '{{').replace(/\{\{ESCAPED_CLOSE\}\}/g, '}}');
}
