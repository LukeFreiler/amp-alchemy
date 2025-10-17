/**
 * Section Formatter Utility
 *
 * Formats section fields as human-readable text for token resolution.
 */

import { Field } from '@/features/blueprints/types/blueprint';

type FieldWithValue = Field & {
  value: string | null;
  sectionId: string;
  sectionTitle: string;
};

/**
 * Format all fields in a section as a human-readable list
 *
 * Example output:
 * ```
 * Project Name: Beta 2025
 * Project Code: BT2025
 * Primary Contact: jane@example.com
 * Active: Yes
 * ```
 *
 * @param fields - Array of fields with values
 * @returns Formatted string with one field per line
 */
export function formatSectionFields(fields: FieldWithValue[]): string {
  // Sort fields by order_index
  const sortedFields = [...fields].sort((a, b) => a.order_index - b.order_index);

  const lines = sortedFields.map((field) => {
    const value = formatFieldValue(field);
    return `${field.label}: ${value}`;
  });

  return lines.join('\n');
}

/**
 * Format a single field value for display
 *
 * @param field - Field with value
 * @returns Formatted value string
 */
function formatFieldValue(field: FieldWithValue): string {
  // Handle null or empty values
  if (field.value === null || field.value === '') {
    return '(empty)';
  }

  // Convert toggle values to Yes/No
  if (field.type === 'Toggle') {
    return field.value === 'true' ? 'Yes' : 'No';
  }

  // For long text, preserve newlines but indent continuation lines
  if (field.type === 'LongText' && field.value.includes('\n')) {
    const lines = field.value.split('\n');
    return lines[0] + (lines.length > 1 ? '\n  ' + lines.slice(1).join('\n  ') : '');
  }

  return field.value;
}

/**
 * Format section fields as a markdown list
 *
 * Example output:
 * ```
 * - **Project Name**: Beta 2025
 * - **Project Code**: BT2025
 * - **Primary Contact**: jane@example.com
 * ```
 *
 * @param fields - Array of fields with values
 * @returns Markdown formatted string
 */
export function formatSectionFieldsAsMarkdown(fields: FieldWithValue[]): string {
  const sortedFields = [...fields].sort((a, b) => a.order_index - b.order_index);

  const lines = sortedFields.map((field) => {
    const value = formatFieldValue(field);
    return `- **${field.label}**: ${value}`;
  });

  return lines.join('\n');
}

/**
 * Format section fields as JSON object
 *
 * @param fields - Array of fields with values
 * @returns JSON string of field key-value pairs
 */
export function formatSectionFieldsAsJson(fields: FieldWithValue[]): string {
  const obj: Record<string, string | boolean | null> = {};

  fields.forEach((field) => {
    // Convert toggle values to boolean
    if (field.type === 'Toggle') {
      obj[field.key] = field.value === 'true' ? true : field.value === 'false' ? false : null;
    } else {
      obj[field.key] = field.value;
    }
  });

  return JSON.stringify(obj, null, 2);
}
