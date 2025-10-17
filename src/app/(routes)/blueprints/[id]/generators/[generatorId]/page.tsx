/**
 * Blueprint Generator Editor Page (Server Component)
 *
 * Full-page editor for creating/editing blueprint generators
 */

import { notFound } from 'next/navigation';
import { query, queryOne } from '@/lib/db/query';
import { BlueprintWithSections } from '@/features/blueprints/types/blueprint';
import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';
import { GeneratorEditorClient } from '@/features/blueprints/components/generator-editor-client';

interface PageProps {
  params: Promise<{
    id: string;
    generatorId: string;
  }>;
}

export default async function GeneratorEditorPage({ params }: PageProps) {
  const { id: blueprintId, generatorId } = await params;

  // Fetch blueprint with sections and fields
  const blueprint = await queryOne<BlueprintWithSections>(
    `SELECT
      b.id,
      b.company_id,
      b.name,
      b.status,
      b.description,
      b.created_at,
      b.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'blueprint_id', s.blueprint_id,
            'order_index', s.order_index,
            'title', s.title,
            'description', s.description,
            'created_at', s.created_at,
            'updated_at', s.updated_at,
            'fields', COALESCE(
              (SELECT json_agg(
                json_build_object(
                  'id', f.id,
                  'section_id', f.section_id,
                  'key', f.key,
                  'type', f.type,
                  'label', f.label,
                  'help_text', f.help_text,
                  'placeholder', f.placeholder,
                  'required', f.required,
                  'span', f.span,
                  'order_index', f.order_index,
                  'created_at', f.created_at,
                  'updated_at', f.updated_at
                ) ORDER BY f.order_index
              )
              FROM fields f
              WHERE f.section_id = s.id
              ), '[]'::json
            )
          ) ORDER BY s.order_index
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
      ) as sections
    FROM blueprints b
    LEFT JOIN sections s ON s.blueprint_id = b.id
    WHERE b.id = $1
    GROUP BY b.id`,
    [blueprintId]
  );

  if (!blueprint) {
    notFound();
  }

  // Fetch generator if editing (generatorId !== 'new')
  let generator: BlueprintArtifactGenerator | null = null;
  if (generatorId !== 'new') {
    generator = await queryOne<BlueprintArtifactGenerator>(
      `SELECT
        id,
        blueprint_id,
        name,
        description,
        prompt_template,
        output_format,
        visible_in_data_room,
        order_index,
        created_at,
        updated_at
      FROM blueprint_artifact_generators
      WHERE id = $1 AND blueprint_id = $2`,
      [generatorId, blueprintId]
    );

    if (!generator) {
      notFound();
    }
  }

  return (
    <GeneratorEditorClient
      blueprint={blueprint}
      generator={generator}
      mode={generatorId === 'new' ? 'create' : 'edit'}
    />
  );
}
