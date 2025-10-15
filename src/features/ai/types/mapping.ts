/**
 * AI Mapping Types
 *
 * Types for semantic mapping of sources to blueprint fields
 */

export type MappingResult = {
  suggestions: Suggestion[];
  unmapped_summary_by_section: Record<string, string>;
};

export type Suggestion = {
  field_key: string;
  value: string;
  confidence: number; // 0.00 to 1.00
  provenance: {
    offset: [number, number]; // [start, end] character positions in source text
  };
};

export type FieldCatalogEntry = {
  key: string;
  label: string;
  help_text: string | null;
  type: string;
  section: string;
};
