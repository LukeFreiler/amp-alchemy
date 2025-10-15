/**
 * Artifact Types
 */

export type Generator = {
  id: string;
  name: string;
  prompt_template: string;
};

export type GenerateResponse = {
  generator_id: string;
  generator_name: string;
  markdown: string;
  prompt: string;
  prompt_hash: string;
};

export type Artifact = {
  id: string;
  session_id: string;
  generator_id: string;
  generator_name: string;
  version: number;
  title: string;
  markdown: string;
  prompt_template_hash: string;
  created_by: string;
  creator_name: string;
  created_at: Date;
  published: boolean;
};

export type GroupedArtifacts = Record<
  string,
  {
    generator_id: string;
    generator_name: string;
    artifacts: Artifact[];
  }
>;
