'use client';

/**
 * Blueprint List Component
 *
 * Displays all blueprints in a card grid with actions (edit, duplicate, delete)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Copy, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CrudHeader } from '@/components/ui/crud-header';
import { toast } from '@/components/ui/toaster';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Blueprint } from '@/features/blueprints/types/blueprint';
import { NewBlueprintModal } from './new-blueprint-modal';

interface BlueprintListProps {
  blueprints: Blueprint[];
}

export function BlueprintList({ blueprints: initialBlueprints }: BlueprintListProps) {
  const router = useRouter();
  const [blueprints, setBlueprints] = useState(initialBlueprints);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  /**
   * Generate a unique name for the duplicated blueprint
   * - If the name ends with a number, increment it
   * - Otherwise, append " 2"
   * - Continue incrementing until we find an available name
   */
  const generateDuplicateName = (originalName: string): string => {
    const existingNames = new Set(blueprints.map((b) => b.name));

    // Check if name ends with a number (e.g., "Blueprint 3" or "Blueprint3")
    const match = originalName.match(/^(.+?)(\s*)(\d+)$/);

    let baseName: string;
    let currentNumber: number;

    if (match) {
      // Name ends with a number
      baseName = match[1]!; // "Blueprint"
      const spacing = match[2] || ''; // " " or ""
      currentNumber = parseInt(match[3]!, 10); // 3
      baseName = baseName + spacing; // "Blueprint " or "Blueprint"
    } else {
      // Name doesn't end with a number
      baseName = originalName + ' ';
      currentNumber = 1;
    }

    // Find the next available number
    let newName: string;
    do {
      currentNumber++;
      newName = `${baseName}${currentNumber}`;
    } while (existingNames.has(newName));

    return newName;
  };

  const handleDuplicate = async (blueprint: Blueprint) => {
    const duplicateName = generateDuplicateName(blueprint.name);

    try {
      const response = await fetch(`/api/v1/blueprints/${blueprint.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: duplicateName }),
      });

      const result = await response.json();

      if (result.ok) {
        // Add the new blueprint to the local state immediately
        setBlueprints((prev) => [...prev, result.data]);

        toast.success('Blueprint duplicated successfully', {
          description: `Created "${duplicateName}"`,
        });

        // Navigate to edit page
        router.push(`/blueprints/${result.data.id}/edit`);
      } else {
        toast.error('Failed to duplicate blueprint', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Failed to duplicate blueprint', {
        description: 'An unexpected error occurred',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/blueprints/${deleteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.ok) {
        setBlueprints((prev) => prev.filter((b) => b.id !== deleteId));
        toast.success('Blueprint deleted successfully');
        setDeleteId(null);
      } else {
        toast.error('Cannot delete blueprint', {
          description: result.error.message,
        });
        setDeleteId(null);
      }
    } catch (error) {
      toast.error('Failed to delete blueprint', {
        description: 'An unexpected error occurred',
      });
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBlueprintCreated = (blueprintId: string) => {
    setShowNewModal(false);
    router.push(`/blueprints/${blueprintId}/edit`);
  };

  const getStatusColor = (status: Blueprint['status']) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'draft':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <>
      <CrudHeader
        title="Blueprints"
        description="Reusable templates for collecting structured data"
        buttonText="New Blueprint"
        buttonIcon={Plus}
        onButtonClick={() => setShowNewModal(true)}
        showSeparator={blueprints.length > 0}
      />

      {blueprints.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No blueprints yet"
          description="Create your first blueprint to get started"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blueprints.map((blueprint) => (
            <Card
              key={blueprint.id}
              className="flex flex-col p-6 transition-colors hover:bg-card/80"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{blueprint.name}</h3>
                  {blueprint.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {blueprint.description}
                    </p>
                  )}
                </div>
                <Badge className={getStatusColor(blueprint.status)}>{blueprint.status}</Badge>
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{blueprint.section_count || 0} sections</span>
                <span>•</span>
                <span>{blueprint.field_count || 0} fields</span>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/blueprints/${blueprint.id}/edit`)}
                >
                  <FileText className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(blueprint)}
                  aria-label="Duplicate blueprint"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(blueprint.id)}
                  aria-label="Delete blueprint"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewBlueprintModal
        open={showNewModal}
        onOpenChange={setShowNewModal}
        onBlueprintCreated={handleBlueprintCreated}
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Blueprint?"
        description={
          <>
            This action cannot be undone. The blueprint and all its sections and fields will be
            permanently deleted.
            <br />
            <br />
            <strong>Note:</strong> Blueprints with existing sessions cannot be deleted. You must
            delete all sessions using this blueprint first.
          </>
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
