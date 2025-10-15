'use client';

/**
 * Generator List Component
 *
 * Displays artifact generators with add/edit/delete/reorder controls
 */

import { useState } from 'react';
import { FileText, Edit, Trash2, Plus, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';
import { GeneratorModal } from './generator-modal';

interface GeneratorListProps {
  blueprintId: string;
  generators: BlueprintArtifactGenerator[];
  onUpdate: () => void;
}

export function GeneratorList({
  blueprintId,
  generators: initialGenerators,
  onUpdate,
}: GeneratorListProps) {
  const [generators, setGenerators] = useState(initialGenerators);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGenerator, setEditingGenerator] = useState<
    BlueprintArtifactGenerator | undefined
  >();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingGenerator(undefined);
    setModalOpen(true);
  };

  const handleEdit = (generator: BlueprintArtifactGenerator) => {
    setEditingGenerator(generator);
    setModalOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    description: string;
    prompt_template: string;
    output_format: string;
    visible_in_data_room: boolean;
  }) => {
    try {
      const url = editingGenerator
        ? `/api/v1/generators/${editingGenerator.id}`
        : `/api/v1/blueprints/${blueprintId}/generators`;

      const method = editingGenerator ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.ok) {
        onUpdate();
        setModalOpen(false);
      } else {
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      alert('Failed to save generator');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/generators/${deleteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.ok) {
        setGenerators((prev) => prev.filter((g) => g.id !== deleteId));
        setDeleteId(null);
        onUpdate();
      } else {
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      alert('Failed to delete generator');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newGenerators = [...generators];
    const draggedItem = newGenerators[draggedIndex];
    if (!draggedItem) return;

    newGenerators.splice(draggedIndex, 1);
    newGenerators.splice(index, 0, draggedItem);

    setGenerators(newGenerators);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const reorderedGenerators = generators.map((gen, idx) => ({
      id: gen.id,
      order_index: idx,
    }));

    try {
      const response = await fetch('/api/v1/generators/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generators: reorderedGenerators }),
      });

      const result = await response.json();

      if (!result.ok) {
        alert(`Error: ${result.error.message}`);
        onUpdate();
      }
    } catch (error) {
      alert('Failed to reorder generators');
      onUpdate();
    } finally {
      setDraggedIndex(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Artifact Generators</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define AI prompts to generate artifacts from session data
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Generator
        </Button>
      </div>

      {generators.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No generators yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your first artifact generator to get started
          </p>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Generator
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {generators.map((generator, index) => (
            <Card
              key={generator.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="flex cursor-move items-center gap-4 p-4 transition-colors hover:bg-card/80"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{generator.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {generator.output_format}
                  </Badge>
                  {generator.visible_in_data_room ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {generator.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {generator.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(generator)}
                  aria-label="Edit generator"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(generator.id)}
                  aria-label="Delete generator"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <GeneratorModal
          generator={editingGenerator}
          blueprintId={blueprintId}
          open={modalOpen}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Generator?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If any artifacts reference this generator, deletion will
              fail.
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
