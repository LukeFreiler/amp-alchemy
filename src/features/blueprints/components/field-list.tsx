'use client';

/**
 * Field List Component
 *
 * Displays fields for a section with drag-and-drop reordering
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
import { GripVertical, Plus, Trash2, Edit, Type, AlignLeft, ToggleLeft } from 'lucide-react';
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
import { Field } from '@/features/blueprints/types/blueprint';

interface FieldListProps {
  fields: Field[];
  onFieldsReorder: (fields: Field[]) => void;
  onAddField: () => void;
  onEditField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
}

function getFieldIcon(type: Field['type']) {
  switch (type) {
    case 'ShortText':
      return Type;
    case 'LongText':
      return AlignLeft;
    case 'Toggle':
      return ToggleLeft;
  }
}

function SortableField({
  field,
  onEdit,
  onDelete,
}: {
  field: Field;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getFieldIcon(field.type);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-card/80">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Icon className="h-4 w-4 text-muted-foreground" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h5 className="font-medium">{field.label}</h5>
            {field.required && (
              <Badge variant="outline" className="h-5 text-xs">
                Required
              </Badge>
            )}
            {field.span === 2 && (
              <Badge variant="outline" className="h-5 text-xs">
                2-col
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{field.key}</p>
        </div>

        <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit field">
          <Edit className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete field">
          <Trash2 className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}

export function FieldList({
  fields: initialFields,
  onFieldsReorder,
  onAddField,
  onEditField,
  onDeleteField,
}: FieldListProps) {
  const [fields, setFields] = useState(initialFields);
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
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const reordered = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        order_index: index,
      }));

      setFields(reordered);
      onFieldsReorder(reordered);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      onDeleteField(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Fields</h3>
          <Button size="sm" variant="outline" onClick={onAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </div>

        {fields.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-2 text-sm text-muted-foreground">No fields yet</p>
            <Button size="sm" onClick={onAddField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={() => onEditField(field.id)}
                  onDelete={() => setDeleteId(field.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this field. This action cannot be undone.
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
