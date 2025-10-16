/**
 * Blueprint type definitions
 */

export interface Blueprint {
  id: string;
  company_id: string;
  name: string;
  status: 'draft' | 'published';
  description: string | null;
  created_at: string;
  updated_at: string;
  section_count?: number; // Computed field from JOIN query
}

export interface Section {
  id: string;
  blueprint_id: string;
  order_index: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type FieldType = 'ShortText' | 'LongText' | 'Toggle';

export interface Field {
  id: string;
  section_id: string;
  key: string;
  type: FieldType;
  label: string;
  help_text: string | null;
  placeholder: string | null;
  required: boolean;
  span: 1 | 2;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Request/Response types for API

export interface CreateBlueprintRequest {
  name: string;
  description?: string;
}

export interface UpdateBlueprintRequest {
  name?: string;
  description?: string;
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string;
}

export interface ReorderSectionsRequest {
  sections: Array<{
    id: string;
    order_index: number;
  }>;
}

export interface CreateFieldRequest {
  key: string;
  type: FieldType;
  label: string;
  help_text?: string;
  placeholder?: string;
  required: boolean;
  span: 1 | 2;
}

export interface UpdateFieldRequest {
  key?: string;
  type?: FieldType;
  label?: string;
  help_text?: string;
  placeholder?: string;
  required?: boolean;
  span?: 1 | 2;
}

export interface ReorderFieldsRequest {
  fields: Array<{
    id: string;
    order_index: number;
  }>;
}

// Extended types with nested data

export interface SectionWithFields extends Section {
  fields: Field[];
}

export interface BlueprintWithSections extends Blueprint {
  sections: SectionWithFields[];
}

export interface BlueprintWithGenerators extends Blueprint {
  generators: Array<{
    id: string;
    name: string;
    description: string | null;
    prompt_template: string;
    output_format: string;
    visible_in_data_room: boolean;
    order_index: number;
  }>;
}
