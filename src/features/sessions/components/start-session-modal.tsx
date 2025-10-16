'use client';

/**
 * Start Session Modal
 *
 * Modal for creating a new session from a published blueprint
 */

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Blueprint } from '@/features/blueprints/types/blueprint';

interface StartSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: (sessionId: string) => void;
}

export function StartSessionModal({
  open,
  onOpenChange,
  onSessionCreated,
}: StartSessionModalProps) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchBlueprints();
    }
  }, [open]);

  const fetchBlueprints = async () => {
    try {
      const response = await fetch('/api/v1/blueprints');
      const result = await response.json();

      if (result.ok) {
        // Filter to only published blueprints
        const published = result.data.filter((b: Blueprint) => b.status === 'published');
        setBlueprints(published);

        // Auto-select first blueprint if available
        if (published.length > 0 && !selectedBlueprintId) {
          setSelectedBlueprintId(published[0].id);
        }
      }
    } catch (error) {
      setError('Failed to load blueprints');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBlueprintId) {
      setError('Please select a blueprint');
      return;
    }

    if (!name.trim()) {
      setError('Session name is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint_id: selectedBlueprintId,
          name: name.trim(),
        }),
      });

      const result = await response.json();

      if (result.ok) {
        onSessionCreated(result.data.id);
        // Reset form
        setName('');
        setSelectedBlueprintId('');
        setError(null);
      } else {
        setError(result.error.message || 'Failed to create session');
      }
    } catch (error) {
      setError('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
          <DialogDescription>
            Create a new data collection session from a published blueprint
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blueprint">Blueprint</Label>
              <Select
                value={selectedBlueprintId}
                onValueChange={setSelectedBlueprintId}
                disabled={isLoading}
              >
                <SelectTrigger id="blueprint">
                  <SelectValue placeholder="Select a blueprint" />
                </SelectTrigger>
                <SelectContent>
                  {blueprints.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No published blueprints available
                    </div>
                  ) : (
                    blueprints.map((blueprint) => (
                      <SelectItem key={blueprint.id} value={blueprint.id}>
                        {blueprint.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q4 Beta Test Planning"
                disabled={isLoading}
                required
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
            <Button type="submit" disabled={isLoading || blueprints.length === 0}>
              {isLoading ? 'Creating...' : 'Start Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
