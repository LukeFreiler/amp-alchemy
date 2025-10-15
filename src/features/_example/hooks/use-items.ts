/**
 * Example hook for the feature module
 *
 * Feature-specific hooks for data fetching, state management, and business logic.
 */

'use client';

import { useState, useEffect } from 'react';
import { Item } from '../types/item';

/**
 * Example hook for fetching and managing items
 *
 * In a real feature, this would call your API routes.
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Example: Replace with actual API call
    const fetchItems = async () => {
      try {
        setLoading(true);
        // const response = await fetch('/api/v1/items');
        // const data = await response.json();

        // Mock data for example
        const mockItems: Item[] = [
          {
            id: '1',
            name: 'Example Item 1',
            description: 'This is an example item',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        setItems(mockItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return { items, loading, error };
}
