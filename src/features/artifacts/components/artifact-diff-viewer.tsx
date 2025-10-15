/**
 * Artifact Diff Viewer Component
 *
 * Shows line-by-line differences between two artifact versions
 */

'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Artifact } from '@/features/artifacts/types/artifact';
import { computeDiff } from '@/lib/artifacts/diff';

type ArtifactDiffViewerProps = {
  oldArtifact: Artifact;
  newArtifact: Artifact;
  onClose: () => void;
};

export function ArtifactDiffViewer({
  oldArtifact,
  newArtifact,
  onClose,
}: ArtifactDiffViewerProps) {
  const diff = useMemo(
    () => computeDiff(oldArtifact.markdown, newArtifact.markdown),
    [oldArtifact.markdown, newArtifact.markdown]
  );

  const promptChanged =
    oldArtifact.prompt_template_hash !== newArtifact.prompt_template_hash;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Compare Versions</DialogTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">v{oldArtifact.version}</Badge>
              <span className="text-muted-foreground">
                {new Date(oldArtifact.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">v{newArtifact.version}</Badge>
              <span className="text-muted-foreground">
                {new Date(newArtifact.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {promptChanged && (
              <Badge className="bg-yellow-900/50 text-yellow-300">
                Prompt Changed
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-md border border-border bg-muted/30">
          <div className="font-mono text-xs">
            {diff.map((part, index) => {
              if (part.added) {
                return (
                  <div
                    key={index}
                    className="bg-green-900/30 px-4 py-1 text-green-300"
                  >
                    {part.value.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="flex">
                        <span className="mr-4 select-none text-green-500/50">
                          +
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                );
              }

              if (part.removed) {
                return (
                  <div
                    key={index}
                    className="bg-red-900/30 px-4 py-1 text-red-300 line-through"
                  >
                    {part.value.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="flex">
                        <span className="mr-4 select-none text-red-500/50">
                          -
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div key={index} className="px-4 py-1 text-foreground/70">
                  {part.value.split('\n').map((line, lineIndex) => (
                    <div key={lineIndex} className="flex">
                      <span className="mr-4 select-none text-muted-foreground">
                        {' '}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-green-900/30" />
              Added
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-red-900/30" />
              Removed
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
