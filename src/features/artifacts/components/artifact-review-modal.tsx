/**
 * Artifact Review Modal Component
 *
 * Side-by-side preview of prompt and generated artifact with save/regenerate actions
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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

export function ArtifactReviewModal({
  sessionId,
  generatorId,
  onClose,
}: ArtifactReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState<GenerateResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showMissingFieldsWarning, setShowMissingFieldsWarning] =
    useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setMissingFields([]);

    try {
      const response = await fetch(
        `/api/v1/sessions/${sessionId}/artifacts/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generator_id: generatorId }),
        }
      );

      const result = (await response.json()) as
        | SuccessResponse
        | ErrorResponse;

      if (result.ok) {
        setArtifact(result.data);
      } else if (result.error.code === 'MISSING_REQUIRED_FIELDS') {
        setMissingFields(result.error.fields || []);
        setShowMissingFieldsWarning(true);
      } else {
        setError(result.error.message || 'Failed to generate artifact');
      }
    } catch (err) {
      setError('Network error occurred while generating artifact');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
  }, [sessionId, generatorId]);

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
      const response = await fetch(
        `/api/v1/sessions/${sessionId}/artifacts/save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generator_id: generatorId,
            markdown: artifact.markdown,
            prompt_template_hash: artifact.prompt_hash,
          }),
        }
      );

      const result = await response.json();

      if (result.ok) {
        onClose();
        // Optionally trigger a refresh of the parent component
        window.location.reload();
      } else {
        setError(result.error?.message || 'Failed to save artifact');
      }
    } catch (err) {
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
              <ul className="list-disc list-inside mt-2">
                {missingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {artifact?.generator_name || 'Generating...'}
          </DialogTitle>
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
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : artifact ? (
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Left: Prompt */}
            <div className="w-1/2 flex flex-col">
              <h3 className="font-semibold mb-2 text-sm">Prompt</h3>
              <div className="flex-1 overflow-y-auto bg-muted p-4 rounded-md font-mono text-xs">
                <pre className="whitespace-pre-wrap">{artifact.prompt}</pre>
              </div>
            </div>

            {/* Right: Generated Output */}
            <div className="w-1/2 flex flex-col">
              <h3 className="font-semibold mb-2 text-sm">Generated Artifact</h3>
              <div className="flex-1 overflow-y-auto prose prose-sm dark:prose-invert bg-card p-4 rounded-md border border-border">
                <ReactMarkdown>{artifact.markdown}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={generate}
            disabled={loading || saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || saving || !artifact}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
