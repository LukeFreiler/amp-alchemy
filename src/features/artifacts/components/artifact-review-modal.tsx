/**
 * Artifact Review Modal Component
 *
 * Side-by-side preview of prompt and generated artifact with save/regenerate actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerateResponse } from '@/features/artifacts/types/artifact';

type ArtifactReviewModalProps = {
  sessionId: string;
  generatorId: string;
  onClose: () => void;
};

type ErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: string[];
  };
};

type SuccessResponse = {
  ok: true;
  data: GenerateResponse;
};

export function ArtifactReviewModal({ sessionId, generatorId, onClose }: ArtifactReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState<GenerateResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showMissingFieldsWarning, setShowMissingFieldsWarning] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissingFields([]);

    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/artifacts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generator_id: generatorId }),
      });

      const result = (await response.json()) as SuccessResponse | ErrorResponse;

      if (result.ok) {
        setArtifact(result.data);
      } else if (result.error.code === 'MISSING_REQUIRED_FIELDS') {
        setMissingFields(result.error.fields || []);
        setShowMissingFieldsWarning(true);
      } else {
        setError(result.error.message || 'Failed to generate artifact');
      }
    } catch (err) {
      console.error('Failed to generate artifact:', err);
      setError('Network error occurred while generating artifact');
    } finally {
      setLoading(false);
    }
  }, [sessionId, generatorId]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleProceedAnyway = () => {
    setShowMissingFieldsWarning(false);
    // Note: In a full implementation, we'd add an override flag to the API
    // For now, user should fill required fields
    onClose();
  };

  const handleSave = async () => {
    if (!artifact) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/artifacts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generator_id: generatorId,
          markdown: artifact.markdown,
          prompt_template_hash: artifact.prompt_hash,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        onClose();
        // Optionally trigger a refresh of the parent component
        window.location.reload();
      } else {
        setError(result.error?.message || 'Failed to save artifact');
      }
    } catch (err) {
      console.error('Failed to save artifact:', err);
      setError('Network error occurred while saving artifact');
    } finally {
      setSaving(false);
    }
  };

  if (showMissingFieldsWarning) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Missing Required Fields</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot Generate Artifact</AlertTitle>
            <AlertDescription>
              The following required fields are missing:
              <ul className="mt-2 list-inside list-disc">
                {missingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleProceedAnyway}>
              Go Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{artifact?.generator_name || 'Generating...'}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : artifact ? (
          <Tabs defaultValue="artifact" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="artifact">Artifact</TabsTrigger>
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
            </TabsList>

            <TabsContent value="artifact" className="mt-4 flex flex-1 flex-col overflow-hidden">
              <div className="prose prose-sm max-w-none flex-1 overflow-y-auto rounded-md border border-border bg-card p-6 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.markdown}</ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="mt-4 flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto rounded-md bg-muted p-4 font-mono text-xs">
                <pre className="whitespace-pre-wrap">{artifact.prompt}</pre>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={generate} disabled={loading || saving}>
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || saving || !artifact}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Artifact'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
