'use client';

/**
 * Field Grid Component
 *
 * 2-column grid layout for rendering fields with proper spacing
 */

import { useState, useEffect } from 'react';
import { FieldRenderer } from './field-renderer';
import { FieldWithValue } from '@/app/api/v1/sessions/[id]/sections/[section_id]/fields/route';

interface FieldGridProps {
  sessionId: string;
  sectionId: string;
  onProgressUpdate?: () => void;
  onValidationChange?: (errorCount: number) => void;
}

export function FieldGrid({
  sessionId,
  sectionId,
  onProgressUpdate,
  onValidationChange,
}: FieldGridProps) {
  const [fields, setFields] = useState<FieldWithValue[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fields on mount and section change
  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/sessions/${sessionId}/sections/${sectionId}/fields`);

        if (!response.ok) {
          throw new Error('Failed to fetch fields');
        }

        const result = await response.json();
        setFields(result.data);
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [sessionId, sectionId]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, value } : f)));
    onProgressUpdate?.();
  };

  const handleValidationChange = (_fieldId: string, _isValid: boolean) => {
    // Track validation state and notify parent
    const currentErrors = fields.filter((f) => f.required && !f.value?.trim());
    onValidationChange?.(currentErrors.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading fields...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <p className="text-center text-muted-foreground">No fields defined for this section</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          sessionId={sessionId}
          onValueChange={handleFieldChange}
          onValidationChange={handleValidationChange}
        />
      ))}
    </div>
  );
}
