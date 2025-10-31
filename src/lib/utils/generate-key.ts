/**
 * Generate a URL-safe key from a string (for sections, fields, etc.)
 *
 * Examples:
 * - "Company Background" -> "company_background"
 * - "Employee Details" -> "employee_details"
 * - "Project Name & Description" -> "project_name_description"
 *
 * @param text - The text to convert to a key
 * @returns A lowercase, underscore-separated key
 */
export function generateKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric chars with underscore
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}
