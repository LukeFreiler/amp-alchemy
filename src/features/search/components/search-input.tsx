'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Search Input Component
 *
 * A search input that triggers the command palette when clicked or focused.
 * This component is designed to be used in the top navigation bar (Epic #18).
 *
 * Usage:
 *   <SearchInput />
 */
export function SearchInput() {
  const handleFocus = () => {
    // Trigger Cmd+K to open command palette
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
    );
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search... (⌘K)"
        className="cursor-pointer pl-10"
        onFocus={handleFocus}
        onClick={handleFocus}
        readOnly
      />
    </div>
  );
}
