'use client';

import { useEffect, useState } from 'react';
import { FileText, Type, Link as LinkIcon, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Source } from '@/features/sources/types/source';

type SourcesListProps = {
  sessionId: string;
  refreshTrigger?: number;
};

export function SourcesList({ sessionId, refreshTrigger }: SourcesListProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, [sessionId, refreshTrigger]);

  const fetchSources = async () => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/sources`);
      if (response.ok) {
        const data = await response.json();
        setSources(data.data || []);
      }
    } catch (error) {
      // Silent fail for now
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/v1/sources/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      // Silent fail for now
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-5 h-5 text-muted-foreground" />;
      case 'paste':
        return <Type className="w-5 h-5 text-muted-foreground" />;
      case 'url':
        return <LinkIcon className="w-5 h-5 text-muted-foreground" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">Loading sources...</div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No sources imported yet. Use the Import button to add files or text.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <Card key={source.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {getIcon(source.type)}

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {source.filename_or_url || 'Pasted Text'}
                </p>
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

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(source.id)}
              disabled={deletingId === source.id}
              className="ml-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
