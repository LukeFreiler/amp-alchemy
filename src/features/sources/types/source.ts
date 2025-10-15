/**
 * Source Types
 *
 * Represents imported data sources (files, pasted text, URLs)
 */

export type SourceType = 'file' | 'paste' | 'url';

export type Source = {
  id: string;
  session_id: string;
  type: SourceType;
  filename_or_url: string | null;
  text_extracted: string;
  metadata: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
};
