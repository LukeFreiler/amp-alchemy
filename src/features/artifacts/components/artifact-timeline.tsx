/**
 * Artifact Timeline Component
 *
 * Shows version history for a specific generator's artifacts
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Eye, Trash2, GitCompare, Clock } from 'lucide-react';
import { Artifact, GroupedArtifacts } from '@/features/artifacts/types/artifact';
import { ArtifactViewer } from './artifact-viewer';
import { ArtifactDiffViewer } from './artifact-diff-viewer';

type ArtifactTimelineProps = {
  sessionId: string;
  generatorId: string;
  onClose: () => void;
};

export function ArtifactTimeline({
  sessionId,
  generatorId,
  onClose,
}: ArtifactTimelineProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [compareArtifacts, setCompareArtifacts] = useState<
    [Artifact, Artifact] | null
  >(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const response = await fetch(
          `/api/v1/sessions/${sessionId}/artifacts`
        );
        const result = await response.json();

        if (result.ok) {
          const grouped = result.data as GroupedArtifacts;
          const generatorArtifacts = grouped[generatorId]?.artifacts || [];
          setArtifacts(generatorArtifacts);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, [sessionId, generatorId]);

  const handleDelete = async (artifactId: string) => {
    if (!confirm('Are you sure you want to delete this artifact version?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/artifacts/${artifactId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.ok) {
        setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
      } else {
        alert(result.error?.message || 'Failed to delete artifact');
      }
    } catch (error) {
      alert('Network error occurred while deleting artifact');
    }
  };

  const handleCompare = (artifact: Artifact) => {
    // Compare with previous version
    const currentIndex = artifacts.findIndex((a) => a.id === artifact.id);
    if (currentIndex >= 0 && currentIndex < artifacts.length - 1) {
      const previousVersion = artifacts[currentIndex + 1];
      if (previousVersion) {
        setCompareArtifacts([previousVersion, artifact]);
      }
    }
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="py-8 text-center text-muted-foreground">
            Loading versions...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (artifacts.length === 0) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            No versions found
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {artifacts[0]?.generator_name} - Version History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {artifacts.map((artifact, index) => (
              <Card key={artifact.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">v{artifact.version}</Badge>
                      {artifact.published && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      )}
                      {index === 0 && (
                        <Badge className="bg-blue-900/50 text-blue-300">
                          Latest
                        </Badge>
                      )}
                    </div>

                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(artifact.created_at).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      )}
                      <span>•</span>
                      <span>{artifact.creator_name}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Prompt hash:{' '}
                      <code className="rounded bg-muted px-1 py-0.5">
                        {artifact.prompt_template_hash.substring(0, 8)}
                      </code>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedArtifact(artifact)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>

                    {index < artifacts.length - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompare(artifact)}
                      >
                        <GitCompare className="mr-1 h-4 w-4" />
                        Diff
                      </Button>
                    )}

                    {!artifact.published && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(artifact.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedArtifact && (
        <ArtifactViewer
          artifactId={selectedArtifact.id}
          onClose={() => setSelectedArtifact(null)}
        />
      )}

      {compareArtifacts && (
        <ArtifactDiffViewer
          oldArtifact={compareArtifacts[0]}
          newArtifact={compareArtifacts[1]}
          onClose={() => setCompareArtifacts(null)}
        />
      )}
    </>
  );
}
