'use client';

/**
 * New Blueprint Modal
 *
 * Modal for creating a new blueprint
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NewBlueprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlueprintCreated: (blueprintId: string) => void;
}

export function NewBlueprintModal({
  open,
  onOpenChange,
  onBlueprintCreated,
}: NewBlueprintModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Blueprint name is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        onBlueprintCreated(result.data.id);
        // Reset form
        setName('');
        setDescription('');
        setError(null);
      } else {
        setError(result.error.message || 'Failed to create blueprint');
      }
    } catch (error) {
      console.error('Failed to create blueprint:', error);
      setError('Failed to create blueprint');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Blueprint</DialogTitle>
          <DialogDescription>
            Create a reusable template for collecting structured data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Blueprint Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Beta Test Plan, Sales Pitch"
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of what this blueprint is for"
                rows={4}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Blueprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
