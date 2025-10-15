/**
 * Session type definitions
 */

import { Section } from '@/features/blueprints/types/blueprint';

export type SessionStatus = 'in_progress' | 'completed' | 'archived';

export interface Session {
  id: string;
  company_id: string;
  blueprint_id: string;
  blueprint_version: number;
  name: string;
  status: SessionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  blueprint_name?: string; // Computed field from JOIN query
  completion_percentage?: number; // Computed field
}

export interface SectionNote {
  id: string;
  session_id: string;
  section_id: string;
  markdown: string;
  created_at: string;
  updated_at: string;
}

export interface SessionFieldValue {
  id: string;
  session_id: string;
  field_id: string;
  value: string | null;
  source_id: string | null;
  confidence_score: number | null;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
}

// Request/Response types for API

export interface CreateSessionRequest {
  blueprint_id: string;
  name: string;
}

export interface UpdateSessionRequest {
  name?: string;
  status?: SessionStatus;
}

export interface UpdateSectionNotesRequest {
  markdown: string;
}

// Extended types with nested data

export interface SectionWithProgress extends Section {
  required_count: number;
  filled_count: number;
  completion_percentage: number;
}

export interface SessionWithSections extends Session {
  sections: SectionWithProgress[];
}
