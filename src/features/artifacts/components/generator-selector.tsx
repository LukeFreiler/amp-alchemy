/**
 * Generator Selector Component
 *
 * List of available generators for selection (left rail)
 */

'use client';

import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';
import { FileText } from 'lucide-react';

interface GeneratorSelectorProps {
  generators: BlueprintArtifactGenerator[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function GeneratorSelector({ generators, selectedId, onSelect }: GeneratorSelectorProps) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Available Generators
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a generator to customize its prompt
        </p>
      </div>

      <div className="space-y-2">
        {generators.map((generator) => (
          <button
            key={generator.id}
            onClick={() => onSelect(generator.id)}
            className={`w-full text-left transition-colors ${
              selectedId === generator.id
                ? 'border-primary bg-accent'
                : 'border-transparent bg-card hover:bg-accent/50'
            } rounded-md border-2 p-3`}
          >
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{generator.name}</h3>
                {generator.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {generator.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{generator.output_format}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
