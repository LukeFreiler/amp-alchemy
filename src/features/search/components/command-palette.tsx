'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Box, FileText, FileOutput } from 'lucide-react';

type SearchResult = {
  type: 'blueprint' | 'session' | 'artifact';
  id: string;
  title: string;
  snippet: string;
  href: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to open palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Listen for custom open event
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setSelectedValue('');
    }
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      // Delay to ensure DOM is ready after render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Handle ESC to close dialog (only when palette is open)
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Just close the dialog - cmdk doesn't actually clear search/value on ESC
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.ok) setResults(json.data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 px-4">
        <Command
          shouldFilter={false}
          loop
          value={selectedValue}
          onValueChange={setSelectedValue}
          className="overflow-hidden rounded-lg border bg-card shadow-2xl"
        >
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Search..."
            className="flex h-12 w-full border-none bg-transparent px-4 py-3 text-base outline-none"
          />
          <Command.List className="max-h-96 overflow-y-auto border-t p-2">
            {loading && (
              <Command.Loading>
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    <span>Searching...</span>
                  </div>
                </div>
              </Command.Loading>
            )}
            <Command.Empty>
              {!search && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Start typing...
                </div>
              )}
              {search && search.length < 2 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Type 2+ characters
                </div>
              )}
              {search && search.length >= 2 && !loading && results.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No results</div>
              )}
            </Command.Empty>
            <Command.Group>
              {results.map((result) => (
                <Command.Item
                  key={`${result.type}-${result.id}`}
                  value={`${result.type}-${result.id}-${result.title}`}
                  onSelect={() => {
                    setOpen(false);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    router.push(result.href as any);
                  }}
                  className="flex cursor-pointer items-start gap-3 rounded-md border-2 border-transparent px-3 py-3 aria-selected:border-primary aria-selected:bg-accent"
                >
                  <div className="mt-0.5">
                    {result.type === 'blueprint' && <Box className="h-5 w-5" />}
                    {result.type === 'session' && <FileText className="h-5 w-5" />}
                    {result.type === 'artifact' && <FileOutput className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-muted-foreground">{result.snippet}</div>
                  </div>
                  <div className="text-xs uppercase text-muted-foreground">{result.type}</div>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex gap-4">
              <div>
                <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd> navigate
              </div>
              <div>
                <kbd className="rounded bg-muted px-1.5 py-0.5">↵</kbd> select
              </div>
            </div>
            <div>
              <kbd className="rounded bg-muted px-1.5 py-0.5">esc</kbd> close
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
