'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Type, Link as LinkIcon, Trash2, Sparkles, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Source } from '@/features/sources/types/source';

type SourcesListProps = {
  sessionId: string;
  refreshTrigger?: number;
  onMappingComplete?: () => void;
};

export function SourcesList({ sessionId, refreshTrigger, onMappingComplete }: SourcesListProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mappingSourceId, setMappingSourceId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSources = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/sources`);
      if (response.ok) {
        const data = await response.json();
        setSources(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources, refreshTrigger]);

  const handleDeleteClick = (id: string) => {
    setDeleteSourceId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSourceId) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/v1/sources/${deleteSourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSources((prev) => prev.filter((s) => s.id !== deleteSourceId));
        setDeleteSourceId(null);
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMapWithAI = async (sourceId: string) => {
    setMappingSourceId(sourceId);

    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/sources/${sourceId}/map`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to map source');
      }

      const data = await response.json();
      const suggestionsCount = data.data?.suggestions_stored || 0;

      toast({
        title: 'AI Mapping Complete',
        description: `Generated ${suggestionsCount} suggestion${suggestionsCount !== 1 ? 's' : ''} from source content.`,
      });

      // Notify parent to refresh suggestions
      onMappingComplete?.();
    } catch (error) {
      console.error('Failed to map source with AI:', error);
      toast({
        title: 'Mapping Failed',
        description: error instanceof Error ? error.message : 'Failed to map source with AI',
        variant: 'destructive',
      });
    } finally {
      setMappingSourceId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      case 'paste':
        return <Type className="h-5 w-5 text-muted-foreground" />;
      case 'url':
        return <LinkIcon className="h-5 w-5 text-muted-foreground" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading sources...</div>;
  }

  if (sources.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No sources yet"
        description="Use the Import button to add files or text"
      />
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <Card key={source.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {getIcon(source.type)}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{source.filename_or_url || 'Pasted Text'}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(source.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  • {source.text_extracted?.length.toLocaleString() || 0} characters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMapWithAI(source.id)}
                disabled={mappingSourceId === source.id || isDeleting}
                className="ml-2"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {mappingSourceId === source.id ? 'Mapping...' : 'Map with AI'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(source.id)}
                disabled={isDeleting || mappingSourceId === source.id}
                aria-label="Delete source"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <AlertDialog
        open={!!deleteSourceId}
        onOpenChange={(open) => {
          if (!open) setDeleteSourceId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This source will be permanently removed from the
              session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
