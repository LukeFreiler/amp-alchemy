/**
 * Artifact Viewer Component
 *
 * Full-screen preview of a single artifact version
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Artifact } from '@/features/artifacts/types/artifact';

type ArtifactViewerProps = {
  artifactId: string;
  onClose: () => void;
};

export function ArtifactViewer({ artifactId, onClose }: ArtifactViewerProps) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtifact = async () => {
      try {
        const response = await fetch(`/api/v1/artifacts/${artifactId}`);
        const result = await response.json();

        if (result.ok) {
          setArtifact(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch artifact:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtifact();
  }, [artifactId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{artifact?.title || 'Loading...'}</DialogTitle>
            {artifact?.published && (
              <Badge variant="outline" className="text-xs">
                <Eye className="mr-1 h-3 w-3" />
                Published
              </Badge>
            )}
          </div>
          {artifact && (
            <div className="text-sm text-muted-foreground">
              v{artifact.version} •{' '}
              {new Date(artifact.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              • {artifact.creator_name}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : artifact ? (
          <div className="prose prose-sm max-w-none flex-1 overflow-y-auto rounded-md border border-border bg-card p-6 dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.markdown}</ReactMarkdown>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">Artifact not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
