'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ImportDialogProps = {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
};

export function ImportDialog({
  sessionId,
  open,
  onOpenChange,
  onImportComplete,
}: ImportDialogProps) {
  const [input, setInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectInputType = (text: string): 'url' | 'text' => {
    const trimmed = text.trim();
    const lines = trimmed.split('\n').filter((line) => line.trim());

    // If all lines are URLs, treat as URLs
    const allUrls = lines.every(
      (line) => line.startsWith('http://') || line.startsWith('https://')
    );

    return allUrls ? 'url' : 'text';
  };

  const processInput = async () => {
    if (!input.trim()) return;

    setImporting(true);
    const type = detectInputType(input);
    const sourceIds: string[] = [];

    try {
      if (type === 'url') {
        // Process as URLs (potentially multiple)
        const urls = input
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        // Process URLs in batches of 3
        const BATCH_SIZE = 3;
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
          const batch = urls.slice(i, i + BATCH_SIZE);

          const results = await Promise.allSettled(
            batch.map(async (url) => {
              const formData = new FormData();
              formData.append('url', url);

              const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error(`Failed to fetch ${url}`);
              }

              const result = await response.json();
              return result.data?.id;
            })
          );

          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              sourceIds.push(result.value);
            }
          });
        }
      } else {
        // Process as pasted text
        const formData = new FormData();
        formData.append('text', input);

        const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.id) {
            sourceIds.push(result.data.id);
          }
        }
      }

      // Auto-map all imported sources
      if (sourceIds.length > 0) {
        await autoMapSources(sourceIds);
      }

      setInput('');
      onOpenChange(false);
      onImportComplete();
    } catch (error) {
      console.error('Failed to import content:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import content',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const autoMapSources = async (sourceIds: string[]) => {
    let autoApplied = 0;
    let needsReview = 0;
    const autoAppliedIds: string[] = [];

    for (const sourceId of sourceIds) {
      try {
        // Trigger mapping
        const mapResponse = await fetch(`/api/v1/sessions/${sessionId}/sources/${sourceId}/map`, {
          method: 'POST',
        });

        if (!mapResponse.ok) continue;

        // Auto-accept high-confidence suggestions (≥90%)
        const suggestionsResponse = await fetch(`/api/v1/sessions/${sessionId}/suggestions`);
        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          const suggestions = suggestionsData.data || [];

          for (const suggestion of suggestions) {
            if (suggestion.confidence >= 0.9) {
              // Auto-accept
              await fetch(`/api/v1/sessions/${sessionId}/suggestions/${suggestion.id}/accept`, {
                method: 'PUT',
              });
              autoApplied++;
              autoAppliedIds.push(suggestion.id);
            } else {
              needsReview++;
            }
          }
        }
      } catch (error) {
        console.error('Failed to map source:', error);
        // Continue with other sources
      }
    }

    // Show result toast with undo button
    if (autoApplied > 0) {
      toast({
        title: 'Import Complete',
        description: `Applied ${autoApplied} high-confidence suggestion${autoApplied !== 1 ? 's' : ''}${needsReview > 0 ? `. ${needsReview} lower-confidence suggestion${needsReview === 1 ? '' : 's'} need${needsReview === 1 ? 's' : ''} review` : ''}`,
        action:
          autoApplied > 0 ? (
            <Button variant="outline" size="sm" onClick={() => handleUndoAll(autoAppliedIds)}>
              Undo All
            </Button>
          ) : undefined,
      });
    } else if (needsReview > 0) {
      toast({
        title: 'Import Complete',
        description: `${needsReview} suggestion${needsReview === 1 ? '' : 's'} need${needsReview === 1 ? 's' : ''} review. Click AI badges on fields to review.`,
      });
    }
  };

  const handleUndoAll = async (suggestionIds: string[]) => {
    try {
      for (const id of suggestionIds) {
        // Reject the suggestion to remove the applied value
        await fetch(`/api/v1/sessions/${sessionId}/suggestions/${id}/reject`, {
          method: 'PUT',
        });
      }

      toast({
        title: 'Undone',
        description: `Removed ${suggestionIds.length} auto-applied suggestion${suggestionIds.length !== 1 ? 's' : ''}`,
      });

      onImportComplete();
    } catch (error) {
      console.error('Failed to undo suggestions:', error);
      toast({
        title: 'Undo Failed',
        description: 'Failed to undo suggestions',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setImporting(true);
    const sourceIds: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data?.id) {
            sourceIds.push(result.data.id);
          }
        }
      }

      // Auto-map all imported files
      if (sourceIds.length > 0) {
        await autoMapSources(sourceIds);
      }

      onOpenChange(false);
      onImportComplete();
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import & Map Content</DialogTitle>
          <DialogDescription>
            Drop files, paste URLs (one per line), or type text. High-confidence suggestions will be
            applied automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              'relative rounded-lg border-2 border-dashed transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-border',
              importing && 'pointer-events-none opacity-50'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Drop files, paste URLs (one per line), or type text here..."
              rows={6}
              disabled={importing}
              className="resize-none border-0 bg-transparent focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  processInput();
                }
              }}
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(e.target.files);
                }
              }}
              accept=".pdf,.docx,.txt,.md,.csv"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={importing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
              {input && (
                <Button onClick={() => setInput('')} variant="ghost" size="sm" disabled={importing}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <Button onClick={processInput} disabled={!input.trim() || importing} size="sm">
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Import & Map'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
