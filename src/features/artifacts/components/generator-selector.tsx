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
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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
                ? 'bg-accent border-primary'
                : 'bg-card hover:bg-accent/50 border-transparent'
            } border-2 rounded-md p-3`}
          >
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{generator.name}</h3>
                {generator.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {generator.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {generator.output_format}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
