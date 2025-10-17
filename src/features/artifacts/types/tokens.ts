/**
 * Token System Types
 *
 * Type definitions for the token metadata, resolution, and validation system.
 */

import { Field, Section } from '@/features/blueprints/types/blueprint';
import { SectionNote } from '@/features/sessions/types/session';

/**
 * Token metadata for a single field
 */
export type FieldTokenMetadata = {
  token: string; // e.g., "{{field:project_name}}"
  label: string; // Field label for display
  type: 'ShortText' | 'LongText' | 'Toggle';
  value: string | null; // Current field value
  sectionTitle: string; // Section this field belongs to
  sectionId: string;
  fieldKey: string; // The key used in the token
  required: boolean;
};

/**
 * Token metadata for an entire section
 */
export type SectionTokenMetadata = {
  token: string; // e.g., "{{section:project_overview}}"
  label: string; // Section title for display
  sectionId: string;
  fieldCount: number;
  hasFields: boolean;
};

/**
 * Token metadata for section notes
 */
export type NotesTokenMetadata = {
  token: string; // e.g., "{{notes:project_overview}}"
  label: string; // Section title + " Notes"
  sectionId: string;
  hasContent: boolean;
};

/**
 * Complete token metadata response
 */
export type TokenMetadataResponse = {
  fields: FieldTokenMetadata[];
  sections: SectionTokenMetadata[];
  notes: NotesTokenMetadata[];
  legacy: {
    fields_json: { token: string; label: string };
    notes_json: { token: string; label: string };
  };
};

/**
 * Data required for token resolution
 */
export type TokenResolutionData = {
  fields: Array<Field & { value: string | null; sectionId: string; sectionTitle: string }>;
  sections: Section[];
  notes: Array<SectionNote & { sectionTitle: string }>;
};

/**
 * Token validation error details
 */
export type TokenValidationError = {
  token: string;
  type: 'field' | 'section' | 'notes';
  message: string;
  suggestions?: string[];
};

/**
 * Token validation result
 */
export type TokenValidationResult = {
  valid: boolean;
  errors: TokenValidationError[];
};
