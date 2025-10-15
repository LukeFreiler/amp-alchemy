/**
 * Artifacts List Component
 *
 * Displays all artifacts for a session, grouped by generator
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye } from 'lucide-react';
import { GroupedArtifacts } from '@/features/artifacts/types/artifact';
import { ArtifactTimeline } from './artifact-timeline';

type ArtifactsListProps = {
  sessionId: string;
};

export function ArtifactsList({ sessionId }: ArtifactsListProps) {
  const [artifactsGrouped, setArtifactsGrouped] = useState<GroupedArtifacts>({});
  const [loading, setLoading] = useState(true);
  const [selectedGenerator, setSelectedGenerator] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const response = await fetch(`/api/v1/sessions/${sessionId}/artifacts`);
        const result = await response.json();

        if (result.ok) {
          setArtifactsGrouped(result.data);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, [sessionId]);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading artifacts...</div>;
  }

  const groupEntries = Object.values(artifactsGrouped);

  if (groupEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          No artifacts generated yet. Use the Generate button to create your first artifact.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groupEntries.map((group) => (
          <div key={group.generator_id}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{group.generator_name}</h2>
              <Badge variant="outline">
                {group.artifacts.length} version
                {group.artifacts.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-2">
              {group.artifacts.map((artifact) => (
                <Card
                  key={artifact.id}
                  className="cursor-pointer p-4 transition-colors hover:bg-card/80"
                  onClick={() => setSelectedGenerator(group.generator_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{artifact.title}</span>
                          {artifact.published && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="mr-1 h-3 w-3" />
                              Published
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(artifact.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          • {artifact.creator_name}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Versions
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedGenerator && (
        <ArtifactTimeline
          sessionId={sessionId}
          generatorId={selectedGenerator}
          onClose={() => setSelectedGenerator(null)}
        />
      )}
    </>
  );
}
