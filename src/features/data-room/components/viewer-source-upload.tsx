'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/features/sources/components/file-upload';
import { TextPaste } from '@/features/sources/components/text-paste';

type ViewerSourceUploadProps = {
  token: string;
};

export function ViewerSourceUpload({ token }: ViewerSourceUploadProps) {
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleComplete = () => {
    setUploadComplete(true);
    setTimeout(() => setUploadComplete(false), 3000);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Upload Additional Sources</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        You can upload files or paste text to contribute to this session. Uploads will be reviewed
        by the editor.
      </p>

      {uploadComplete && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
          Upload successful! Your contribution has been received.
        </div>
      )}

      <Tabs defaultValue="file">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsTrigger value="paste">Paste Text</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <FileUpload uploadUrl={`/api/v1/share/${token}/sources`} onComplete={handleComplete} />
        </TabsContent>

        <TabsContent value="paste" className="mt-6">
          <TextPaste uploadUrl={`/api/v1/share/${token}/sources`} onComplete={handleComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
