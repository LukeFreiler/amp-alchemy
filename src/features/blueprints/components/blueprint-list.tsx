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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Blueprint } from '@/features/blueprints/types/blueprint';

interface BlueprintListProps {
  blueprints: Blueprint[];
}

export function BlueprintList({ blueprints: initialBlueprints }: BlueprintListProps) {
  const router = useRouter();
  const [blueprints, setBlueprints] = useState(initialBlueprints);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDuplicate = async (blueprint: Blueprint) => {
    const name = prompt(`Enter name for duplicate:`, `${blueprint.name} (Copy)`);
    if (!name) return;

    try {
      const response = await fetch(`/api/v1/blueprints/${blueprint.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (result.ok) {
        router.push(`/blueprints/${result.data.id}/edit`);
      } else {
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      alert('Failed to duplicate blueprint');
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
        setDeleteId(null);
      } else {
        alert(`Cannot delete: ${result.error.message}`);
        setDeleteId(null);
      }
    } catch (error) {
      alert('Failed to delete blueprint');
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
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
        onButtonClick={() => router.push('/blueprints/new')}
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

              <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{blueprint.section_count || 0} sections</span>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/blueprints/${blueprint.id}/edit`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blueprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The blueprint and all its sections and fields will be
              permanently deleted.
              <br />
              <br />
              <strong>Note:</strong> Blueprints with existing sessions cannot be deleted. You must
              delete all sessions using this blueprint first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
