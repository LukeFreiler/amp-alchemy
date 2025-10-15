'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

import { cn } from '@/lib/utils';

type FileUploadProps = {
  sessionId: string;
  onComplete: () => void;
};

export function FileUpload({ sessionId, onComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles, rejectedFiles) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection?.errors[0]?.code === 'file-too-large') {
          setError('File size exceeds 10MB limit');
        } else if (rejection?.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload PDF, DOCX, TXT, CSV, or MD files');
        } else {
          setError('Failed to process file');
        }
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i];
          if (!file) continue;

          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to upload file');
          }

          setProgress(((i + 1) / acceptedFiles.length) * 100);
        }

        setUploading(false);
        onComplete();
      } catch (err) {
        setUploading(false);
        setError(err instanceof Error ? err.message : 'Failed to upload file');
      }
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PDF, DOCX, TXT, CSV, Markdown • Max 10MB per file
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
