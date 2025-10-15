'use client';

/**
 * Field Renderer Component
 *
 * Renders individual field inputs with autosave and validation
 */

import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FieldWithValue } from '@/app/api/v1/sessions/[id]/sections/[section_id]/fields/route';

interface FieldRendererProps {
  field: FieldWithValue;
  sessionId: string;
  onValueChange: (fieldId: string, value: string) => void;
  onValidationChange?: (fieldId: string, isValid: boolean) => void;
}

export function FieldRenderer({
  field,
  sessionId,
  onValueChange,
  onValidationChange,
}: FieldRendererProps) {
  const [value, setValue] = useState(field.value || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update local value when field prop changes
  useEffect(() => {
    setValue(field.value || '');
  }, [field.value]);

  const debouncedSave = useDebouncedCallback(async (newValue: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to save field');
      }

      onValueChange(field.id, newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field value');
    } finally {
      setIsSaving(false);
    }
  }, 500);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setError(null);
    debouncedSave(newValue);
  };

  const validate = () => {
    if (field.required && !value.trim()) {
      const errorMsg = `${field.label} is required`;
      setError(errorMsg);
      onValidationChange?.(field.id, false);
      return false;
    }
    setError(null);
    onValidationChange?.(field.id, true);
    return true;
  };

  return (
    <div className={cn('space-y-2', field.span === 2 ? 'col-span-2' : 'col-span-1')}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
        {isSaving && <span className="ml-2 text-xs text-muted-foreground">Saving...</span>}
      </Label>

      {field.type === 'ShortText' && (
        <Input
          id={field.id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={validate}
          placeholder={field.placeholder || ''}
          className={error ? 'border-destructive' : ''}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
      )}

      {field.type === 'LongText' && (
        <Textarea
          id={field.id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={validate}
          placeholder={field.placeholder || ''}
          rows={4}
          className={error ? 'border-destructive' : ''}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
      )}

      {field.type === 'Toggle' && (
        <div className="flex items-center gap-2">
          <Switch
            id={field.id}
            checked={value === 'true'}
            onCheckedChange={(checked) => handleChange(String(checked))}
          />
          <span className="text-sm text-muted-foreground">{value === 'true' ? 'Yes' : 'No'}</span>
        </div>
      )}

      {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}

      {error && (
        <p id={`${field.id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
