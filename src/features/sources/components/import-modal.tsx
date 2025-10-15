'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from './file-upload';
import { TextPaste } from './text-paste';
import { URLInput } from './url-input';

type ImportModalProps = {
  sessionId: string;
  open: boolean;
  onClose: () => void;
};

export function ImportModal({ sessionId, open, onClose }: ImportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Sources</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-6">
            <FileUpload sessionId={sessionId} onComplete={onClose} />
          </TabsContent>

          <TabsContent value="paste" className="mt-6">
            <TextPaste sessionId={sessionId} onComplete={onClose} />
          </TabsContent>

          <TabsContent value="url" className="mt-6">
            <URLInput sessionId={sessionId} onComplete={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
