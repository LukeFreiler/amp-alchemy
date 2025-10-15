/**
 * Artifact Generator type definitions
 */

export type OutputFormat = 'Markdown' | 'HTML';

export interface BlueprintArtifactGenerator {
  id: string;
  blueprint_id: string;
  name: string;
  description: string | null;
  prompt_template: string;
  output_format: OutputFormat;
  visible_in_data_room: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Request/Response types for API

export interface CreateGeneratorRequest {
  name: string;
  description?: string;
  prompt_template: string;
  output_format: OutputFormat;
  visible_in_data_room?: boolean;
}

export interface UpdateGeneratorRequest {
  name?: string;
  description?: string;
  prompt_template?: string;
  output_format?: OutputFormat;
  visible_in_data_room?: boolean;
}

export interface ReorderGeneratorsRequest {
  generators: Array<{
    id: string;
    order_index: number;
  }>;
}
