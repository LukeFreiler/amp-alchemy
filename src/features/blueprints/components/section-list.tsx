'use client';

/**
 * Section List Component
 *
 * Displays sections with drag-and-drop reordering
 */

import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Edit, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { SectionWithFields } from '@/features/blueprints/types/blueprint';

interface SectionListProps {
  sections: SectionWithFields[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
  onSectionsReorder: (sections: SectionWithFields[]) => void;
  onAddSection: () => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  isLoading?: boolean;
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
    data: {
      type: 'section',
      section,
    },
  });

  // Make this section a droppable target for fields
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: 'section',
      accepts: ['field'],
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine refs for both sortable and droppable
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    setDroppableRef(node);
  };

  return (
    <div ref={combinedRef} style={style}>
      <Card
        className={`flex cursor-pointer items-center gap-2 p-3 transition-colors ${
          isSelected
            ? 'border-2 border-primary bg-accent'
            : isOver
              ? 'border-2 border-primary bg-accent/70 ring-2 ring-primary/50'
              : 'border-2 border-transparent hover:bg-accent/50'
        }`}
        onClick={onSelect}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
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
  onAddSection,
  onEditSection,
  onDeleteSection,
  isLoading = false,
}: SectionListProps) {
  const [sections, setSections] = useState(initialSections);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sync local state with props when they change
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

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
          <Button onClick={onAddSection}>
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Loading sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No sections yet"
            description="Add your first section to organize fields in this blueprint"
          />
        ) : (
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
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
        )}
      </div>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Section?"
        description="This will delete the section and all its fields. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}
