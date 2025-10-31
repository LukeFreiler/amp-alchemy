'use client';

/**
 * Field List Component
 *
 * Displays fields for a section with drag-and-drop reordering
 */

import { useState, useEffect } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  Edit,
  Type,
  AlignLeft,
  ToggleLeft,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Field } from '@/features/blueprints/types/blueprint';

interface FieldListProps {
  fields: Field[];
  onFieldsReorder: (fields: Field[]) => void;
  onAddField: () => void;
  onEditField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  isLoading?: boolean;
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
    data: {
      type: 'field',
      field,
    },
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

        <div className="flex flex-1 items-center gap-2">
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
  onAddField,
  onEditField,
  onDeleteField,
  isLoading = false,
}: FieldListProps) {
  const [fields, setFields] = useState(initialFields);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sync local state with props when they change
  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

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
          <Button onClick={onAddField}>
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Loading fields...</p>
          </div>
        ) : fields.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No fields yet"
            description="Add fields to collect specific data for this section"
          />
        ) : (
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
        )}
      </div>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Field?"
        description="This will permanently delete this field. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}
