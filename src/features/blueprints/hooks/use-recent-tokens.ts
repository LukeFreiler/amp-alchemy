/**
 * Hook for managing recently used tokens in localStorage
 *
 * Tracks up to 10 most recently used tokens and persists them across sessions.
 * Used by token autocomplete to show frequently accessed tokens at the top.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'alchemy:recent_tokens';
const MAX_RECENT = 10;

export function useRecentTokens() {
  const [recentTokens, setRecentTokens] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentTokens(parsed);
        }
      }
    } catch (error) {
      // Ignore parse errors, start with empty array
      console.warn('Failed to load recent tokens from localStorage:', error);
    }
  }, []);

  // Add token to recent list (or move to front if already exists)
  const addRecentToken = useCallback((tag: string) => {
    setRecentTokens((prev) => {
      // Remove if exists, add to front, limit to MAX_RECENT
      const filtered = prev.filter((t) => t !== tag);
      const updated = [tag, ...filtered].slice(0, MAX_RECENT);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent tokens to localStorage:', error);
      }

      return updated;
    });
  }, []);

  return { recentTokens, addRecentToken };
}
