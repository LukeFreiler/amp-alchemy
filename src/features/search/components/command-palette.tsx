'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Box, FileText, FileOutput, Search, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

type SearchResult = {
  type: 'blueprint' | 'session' | 'artifact';
  id: string;
  title: string;
  snippet: string;
  href: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Cmd/Ctrl+K to open palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  // Debounced search on query change
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const json = await response.json();

        if (json.ok) {
          setResults(json.data);
        } else {
          logger.error('Search failed', { error: json.error });
          setResults([]);
        }
      } catch (error) {
        logger.error('Search request failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(result.href as any);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 px-4">
        <Command className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="mr-2 h-5 w-5 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search blueprints, sessions, artifacts..."
              className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Results List */}
          <Command.List className="max-h-96 overflow-y-auto p-2">
            {/* Empty State */}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                No results found
              </Command.Empty>
            )}

            {/* Help Text */}
            {query.trim().length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <p>Start typing to search...</p>
                <p className="mt-2 text-xs">Search across blueprints, sessions, and artifacts</p>
              </div>
            )}

            {query.trim().length === 1 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {/* Results */}
            {results.map((result) => (
              <Command.Item
                key={`${result.type}-${result.id}`}
                onSelect={() => handleSelect(result)}
                className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-3 aria-selected:bg-accent"
              >
                {/* Icon */}
                <div className="mt-0.5">
                  {result.type === 'blueprint' && <Box className="h-5 w-5 text-muted-foreground" />}
                  {result.type === 'session' && (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                  {result.type === 'artifact' && (
                    <FileOutput className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Title & Snippet */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{result.title}</div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">
                    {result.snippet}
                  </div>
                </div>

                {/* Type Badge */}
                <div className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                  {result.type}
                </div>
              </Command.Item>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑</kbd>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
                <span>to select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </Command>
      </div>
    </>
  );
}
