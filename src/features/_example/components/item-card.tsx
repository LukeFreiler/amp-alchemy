/**
 * Example component for the feature module
 *
 * Feature-specific components that use the feature's types, hooks, and utilities.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Item } from '../types/item';
import { formatItemDate, getTimeSince } from '../utils/format-item-date';

export interface ItemCardProps {
  item: Item;
}

/**
 * Display an item in a card
 *
 * This is a feature-specific component that uses:
 * - Shared UI components from @/components/ui
 * - Feature types from ../types
 * - Feature utilities from ../utils
 */
export function ItemCard({ item }: ItemCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>
          Created {formatItemDate(item.createdAt)} • {getTimeSince(item.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  );
}
