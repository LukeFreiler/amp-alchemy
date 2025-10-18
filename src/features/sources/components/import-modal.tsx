'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from './file-upload';
import { TextPaste } from './text-paste';
import { URLBatchInput } from './url-batch-input';
import { SourcesList } from './sources-list';

type ImportModalProps = {
  sessionId: string;
  open: boolean;
  onClose: () => void;
  onMappingComplete?: () => void;
};

export function ImportModal({ sessionId, open, onClose, onMappingComplete }: ImportModalProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoMap, setAutoMap] = useState(true);
  const [mapping, setMapping] = useState(false);
  const [mappingProgress, setMappingProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const triggerMapping = async (sourceIds: string[]) => {
    if (!autoMap || sourceIds.length === 0) {
      return;
    }

    setMapping(true);
    setMappingProgress({ current: 0, total: sourceIds.length });

    let totalSuggestions = 0;
    let successCount = 0;

    for (let i = 0; i < sourceIds.length; i++) {
      const sourceId = sourceIds[i];
      if (!sourceId) continue;

      setMappingProgress({ current: i + 1, total: sourceIds.length });

      try {
        const response = await fetch(`/api/v1/sessions/${sessionId}/sources/${sourceId}/map`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          const count = data.data?.suggestions_stored || 0;
          totalSuggestions += count;
          successCount++;
        }
      } catch (error) {
        // Continue with other sources even if one fails
      }
    }

    setMapping(false);

    if (successCount > 0) {
      toast({
        title: 'Import Complete',
        description: `Imported and mapped ${successCount} source${successCount !== 1 ? 's' : ''}. ${totalSuggestions} suggestion${totalSuggestions !== 1 ? 's' : ''} ready to review.`,
      });

      onMappingComplete?.();

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      toast({
        title: 'Mapping Failed',
        description: 'Sources imported but mapping failed. Use Sources tab to retry.',
        variant: 'destructive',
      });
    }
  };

  const handleFileComplete = async () => {
    setRefreshTrigger((prev) => prev + 1);
    // Note: File upload doesn't return sourceId in the current implementation
    // We could enhance this later, but for now just refresh the list
  };

  const handlePasteComplete = async () => {
    setRefreshTrigger((prev) => prev + 1);
    // Note: Text paste doesn't return sourceId in the current implementation
    // We could enhance this later, but for now just refresh the list
  };

  const handleUrlComplete = async (sourceIds: string[]) => {
    setRefreshTrigger((prev) => prev + 1);
    await triggerMapping(sourceIds);
  };

  const handleMappingComplete = () => {
    // Notify parent (session-shell) to refresh suggestions
    onMappingComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Sources</DialogTitle>
        </DialogHeader>

        {/* Auto-map toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-map"
            checked={autoMap}
            onCheckedChange={(checked) => setAutoMap(checked === true)}
            disabled={mapping}
          />
          <Label htmlFor="auto-map" className="cursor-pointer text-sm">
            Automatically map content to fields after import
          </Label>
        </div>

        {/* Mapping progress indicator */}
        {mapping && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-700/50 bg-blue-950/30 p-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-sm">
              Analyzing content and mapping to fields... ({mappingProgress.current}/
              {mappingProgress.total})
            </span>
          </div>
        )}

        <Tabs defaultValue="sources" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="file">Upload</TabsTrigger>
            <TabsTrigger value="paste">Paste</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="mt-6">
            <SourcesList
              sessionId={sessionId}
              refreshTrigger={refreshTrigger}
              onMappingComplete={handleMappingComplete}
            />
          </TabsContent>

          <TabsContent value="file" className="mt-6">
            <FileUpload sessionId={sessionId} onComplete={handleFileComplete} />
          </TabsContent>

          <TabsContent value="paste" className="mt-6">
            <TextPaste sessionId={sessionId} onComplete={handlePasteComplete} />
          </TabsContent>

          <TabsContent value="url" className="mt-6">
            <URLBatchInput sessionId={sessionId} onComplete={handleUrlComplete} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
