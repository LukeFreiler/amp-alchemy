'use client';

import { useState } from 'react';
import { Loader2, ExternalLink, X, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type UrlStatus = 'pending' | 'scraping' | 'success' | 'failed';

type UrlQueueItem = {
  url: string;
  status: UrlStatus;
  error?: string;
  sourceId?: string;
};

export type URLBatchInputProps = {
  sessionId: string;
  onComplete: (sourceIds: string[]) => void;
};

export function URLBatchInput({ sessionId, onComplete }: URLBatchInputProps) {
  const [input, setInput] = useState('');
  const [queue, setQueue] = useState<UrlQueueItem[]>([]);
  const [processing, setProcessing] = useState(false);

  const parseUrls = (text: string): string[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const validateUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleAddToQueue = () => {
    const urls = parseUrls(input);
    const newItems: UrlQueueItem[] = urls.map((url) => ({
      url,
      status: validateUrl(url) ? 'pending' : 'failed',
      error: validateUrl(url) ? undefined : 'Invalid URL format',
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setInput('');
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScrapeAll = async () => {
    setProcessing(true);
    const pendingUrls = queue.filter((item) => item.status === 'pending');
    const sourceIds: string[] = [];

    // Process in batches of 3
    const BATCH_SIZE = 3;
    for (let i = 0; i < pendingUrls.length; i += BATCH_SIZE) {
      const batch = pendingUrls.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (item) => {
          const index = queue.indexOf(item);

          // Update status to scraping
          setQueue((prev) =>
            prev.map((q, i) => (i === index ? { ...q, status: 'scraping' as UrlStatus } : q))
          );

          try {
            const formData = new FormData();
            formData.append('url', item.url);

            const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.error?.message || 'Failed to scrape');
            }

            const result = await response.json();
            const sourceId = result.data?.id;

            if (sourceId) {
              sourceIds.push(sourceId);
            }

            // Update to success
            setQueue((prev) =>
              prev.map((q, i) =>
                i === index ? { ...q, status: 'success' as UrlStatus, sourceId } : q
              )
            );
          } catch (error) {
            // Update to failed
            setQueue((prev) =>
              prev.map((q, i) =>
                i === index
                  ? {
                      ...q,
                      status: 'failed' as UrlStatus,
                      error: error instanceof Error ? error.message : 'Failed to scrape',
                    }
                  : q
              )
            );
          }
        })
      );
    }

    setProcessing(false);

    // Trigger completion with all successful source IDs
    if (sourceIds.length > 0) {
      onComplete(sourceIds);
    }
  };

  const getStatusIcon = (status: UrlStatus) => {
    switch (status) {
      case 'scraping':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <ExternalLink className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: UrlStatus) => {
    const config = {
      pending: { variant: 'outline' as const, label: 'pending' },
      scraping: { variant: 'default' as const, label: 'scraping' },
      success: { variant: 'default' as const, label: 'success' },
      failed: { variant: 'destructive' as const, label: 'failed' },
    };

    const { variant, label } = config[status];

    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    );
  };

  const pendingCount = queue.filter((q) => q.status === 'pending').length;
  const successCount = queue.filter((q) => q.status === 'success').length;
  const totalCount = queue.length;
  const progressPercent = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url-batch">URLs (one per line)</Label>
        <Textarea
          id="url-batch"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`https://example.com/article-1
https://example.com/article-2
https://docs.example.com/guide`}
          rows={6}
          disabled={processing}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Paste multiple URLs to batch scrape content. Each URL should be on a new line.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAddToQueue}
          disabled={!input.trim() || processing}
          variant="outline"
          className="flex-1"
        >
          Add to Queue ({parseUrls(input).length})
        </Button>
      </div>

      {queue.length > 0 && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Queue ({pendingCount} pending, {successCount} completed)
              </span>
              {!processing && pendingCount > 0 && (
                <Button onClick={() => setQueue([])} variant="ghost" size="sm">
                  Clear All
                </Button>
              )}
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border bg-card p-3">
              {queue.map((item, index) => (
                <Card key={index} className="flex items-center gap-3 p-3">
                  {getStatusIcon(item.status)}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm">{item.url}</p>
                    {item.error && <p className="text-xs text-destructive">{item.error}</p>}
                  </div>

                  {getStatusBadge(item.status)}

                  {!processing && item.status === 'pending' && (
                    <Button
                      onClick={() => handleRemoveFromQueue(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {processing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing batch...</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {!processing && pendingCount > 0 && (
            <Button onClick={handleScrapeAll} className="w-full">
              <ExternalLink className="h-4 w-4" />
              Scrape All URLs ({pendingCount})
            </Button>
          )}
        </>
      )}
    </div>
  );
}
