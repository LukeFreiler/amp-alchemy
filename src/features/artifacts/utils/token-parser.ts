/**
 * Token Parser Utility
 *
 * Parses token syntax from prompt templates and extracts structured token information.
 *
 * Supported token types:
 * - {{field_key}} - Individual field value (simple format)
 * - {{field:key}} - Individual field value (legacy format, for backward compatibility)
 * - {{fields_json}} - Legacy: All fields as JSON
 * - {{notes_json}} - Legacy: All notes as JSON
 */

export type TokenType = 'field' | 'fields_json' | 'notes_json';

export type ParsedToken = {
  type: TokenType;
  key: string; // field key or 'fields_json'/'notes_json'
  raw: string; // original token string including braces
  start: number; // position in template
  end: number; // position in template
};

// Token regex patterns
const TOKEN_PATTERNS = {
  // Simple format: {{field_key}}
  simple_field: /\{\{([a-z0-9_-]+)\}\}/gi,
  // Legacy formats
  legacy_field: /\{\{field:([a-z0-9_-]+)\}\}/gi,
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

  // Extract legacy field tokens ({{field:key}})
  const legacyFieldRegex = new RegExp(TOKEN_PATTERNS.legacy_field.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = legacyFieldRegex.exec(template)) !== null) {
    tokens.push({
      type: 'field',
      key: match[1],
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Extract fields_json and notes_json
  ['fields_json', 'notes_json'].forEach((type) => {
    const pattern = TOKEN_PATTERNS[type as keyof typeof TOKEN_PATTERNS];
    const regex = new RegExp(pattern.source, 'gi');
    while ((match = regex.exec(template)) !== null) {
      tokens.push({
        type: type as TokenType,
        key: type,
        raw: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  });

  // Extract simple field tokens ({{field_key}}) - must check they're not already matched
  const simpleFieldRegex = new RegExp(TOKEN_PATTERNS.simple_field.source, 'gi');
  while ((match = simpleFieldRegex.exec(template)) !== null) {
    const key = match[1];
    // Skip if it's fields_json or notes_json
    if (key === 'fields_json' || key === 'notes_json') continue;

    // Skip if already matched by legacy pattern
    const alreadyMatched = tokens.some(
      (t) => t.start === match!.index && t.end === match!.index + match![0].length
    );
    if (alreadyMatched) continue;

    tokens.push({
      type: 'field',
      key,
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

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

  // Find potential malformed tokens
  const malformedPatterns = [
    /\{\{field:\s*\}\}/g, // Empty legacy field key
    /\{\{\s*\}\}/g, // Empty braces
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
