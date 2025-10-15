'use client';

import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export type URLInputProps = {
  sessionId: string;
  onComplete: () => void;
};

export function URLInput({ sessionId, onComplete }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setError(null);
    setScraping(true);

    try {
      const formData = new FormData();
      formData.append('url', url);

      const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      setScraping(false);
      setUrl('');
      onComplete();
    } catch (err) {
      setScraping(false);
      setError((err as Error).message || 'Failed to scrape URL');
    }
  };

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          disabled={scraping}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'url-error' : undefined}
        />
        <p className="text-xs text-muted-foreground">
          Enter a URL to extract content from web pages, articles, or
          documentation.
        </p>
      </div>

      {error && (
        <div
          id="url-error"
          className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3"
        >
          {error}
        </div>
      )}

      <Button
        onClick={handleScrape}
        disabled={!url.trim() || !isValidUrl || scraping}
        className="w-full"
      >
        {scraping ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scraping...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Scrape URL
          </>
        )}
      </Button>
    </div>
  );
}
