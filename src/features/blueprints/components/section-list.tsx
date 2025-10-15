'use client';

/**
 * Section List Component
 *
 * Displays sections with drag-and-drop reordering
 */

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { SectionWithFields } from '@/features/blueprints/types/blueprint';

interface SectionListProps {
  sections: SectionWithFields[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
  onSectionsReorder: (sections: SectionWithFields[]) => void;
  onAddSection: () => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
}

function SortableSection({
  section,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  section: SectionWithFields;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`flex items-center gap-2 p-3 transition-colors ${
          isSelected ? 'bg-accent' : 'hover:bg-card/80'
        }`}
        onClick={onSelect}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <h4 className="font-medium">{section.title}</h4>
          <p className="text-xs text-muted-foreground">{section.fields.length} fields</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit section"
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}

export function SectionList({
  sections: initialSections,
  selectedSectionId,
  onSectionSelect,
  onSectionsReorder,
  onAddSection,
  onEditSection,
  onDeleteSection,
}: SectionListProps) {
  const [sections, setSections] = useState(initialSections);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order_index: index,
      }));

      setSections(reordered);
      onSectionsReorder(reordered);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      onDeleteSection(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Sections</h3>
          <Button size="sm" variant="outline" onClick={onAddSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        {sections.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-2 text-sm text-muted-foreground">No sections yet</p>
            <Button size="sm" onClick={onAddSection}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isSelected={section.id === selectedSectionId}
                  onSelect={() => onSectionSelect(section.id)}
                  onEdit={() => onEditSection(section.id)}
                  onDelete={() => setDeleteId(section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the section and all its fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
