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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <Command className="rounded-lg border border-border shadow-2xl bg-card overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="w-5 h-5 text-muted-foreground mr-2" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search blueprints, sessions, artifacts..."
              className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
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
                <p className="mt-2 text-xs">
                  Search across blueprints, sessions, and artifacts
                </p>
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
                className="flex items-start gap-3 px-3 py-3 rounded-md cursor-pointer aria-selected:bg-accent"
              >
                {/* Icon */}
                <div className="mt-0.5">
                  {result.type === 'blueprint' && (
                    <Box className="w-5 h-5 text-muted-foreground" />
                  )}
                  {result.type === 'session' && (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                  {result.type === 'artifact' && (
                    <FileOutput className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Title & Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{result.title}</div>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">
                    {result.snippet}
                  </div>
                </div>

                {/* Type Badge */}
                <div className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">
                  {result.type}
                </div>
              </Command.Item>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↵</kbd>
                <span>to select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </Command>
      </div>
    </>
  );
}
