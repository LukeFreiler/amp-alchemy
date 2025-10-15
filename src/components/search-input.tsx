/**
 * Search input component for top navigation bar
 *
 * Opens the command palette when clicked or focused.
 * Shows ⌘K keyboard shortcut hint.
 */

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

export interface SearchInputProps {
  className?: string;
}

export function SearchInput({ className }: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleClick = () => {
    // Trigger command palette opening
    // This will dispatch a keyboard event that the CommandPalette component will listen for
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClick();
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={handleClick}
          onFocus={handleClick}
          placeholder="Search... (⌘K)"
          className="h-9 w-full pl-9 pr-4"
          aria-label="Search"
        />
      </div>
    </form>
  );
}
