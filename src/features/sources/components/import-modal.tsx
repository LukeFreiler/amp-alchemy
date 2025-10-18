'use client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from './file-upload';
import { TextPaste } from './text-paste';
import { URLInput } from './url-input';
import { SourcesList } from './sources-list';

type ImportModalProps = {
  sessionId: string;
  open: boolean;
  onClose: () => void;
  onMappingComplete?: () => void;
};

export function ImportModal({ sessionId, open, onClose, onMappingComplete }: ImportModalProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
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
            <FileUpload sessionId={sessionId} onComplete={handleImportComplete} />
          </TabsContent>

          <TabsContent value="paste" className="mt-6">
            <TextPaste sessionId={sessionId} onComplete={handleImportComplete} />
          </TabsContent>

          <TabsContent value="url" className="mt-6">
            <URLInput sessionId={sessionId} onComplete={handleImportComplete} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
