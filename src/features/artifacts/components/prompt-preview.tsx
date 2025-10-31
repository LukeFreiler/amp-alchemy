/**
 * Prompt Preview Component
 *
 * Live preview of resolved prompt with debouncing
 */

'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { useTokenResolution } from '../hooks/use-token-resolution';

interface PromptPreviewProps {
  sessionId: string;
  template: string;
}

export function PromptPreview({ sessionId, template }: PromptPreviewProps) {
  const { resolved, errors, loading } = useTokenResolution(sessionId, template);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (resolved) {
      await navigator.clipboard.writeText(resolved);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Live Preview</h2>
          <p className="text-xs text-muted-foreground">Resolved tokens with session data</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!resolved || loading}>
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && <div className="text-sm text-muted-foreground">Resolving tokens...</div>}

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Invalid tokens found:</div>
              <ul className="mt-2 list-inside list-disc text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {resolved && !loading && (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{resolved}</pre>
        )}

        {!resolved && !loading && template && (
          <div className="text-sm text-muted-foreground">No valid tokens to resolve</div>
        )}

        {!template && (
          <div className="text-sm text-muted-foreground">
            Enter a prompt template to see preview
          </div>
        )}
      </div>
    </div>
  );
}
