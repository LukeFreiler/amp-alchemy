'use client';

/**
 * Field Configuration Modal
 *
 * Modal for creating and editing fields with all properties
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Field, FieldType } from '@/features/blueprints/types/blueprint';

interface FieldConfigModalProps {
  field?: Field;
  sectionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Field>) => Promise<void>;
}

export function FieldConfigModal({
  field,
  sectionId,
  open,
  onOpenChange,
  onSave,
}: FieldConfigModalProps) {
  const [type, setType] = useState<FieldType>(field?.type || 'ShortText');
  const [key, setKey] = useState(field?.key || '');
  const [label, setLabel] = useState(field?.label || '');
  const [helpText, setHelpText] = useState(field?.help_text || '');
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [required, setRequired] = useState(field?.required || false);
  const [span, setSpan] = useState<1 | 2>(field?.span || 1);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when field changes
  useEffect(() => {
    if (field) {
      setType(field.type);
      setKey(field.key);
      setLabel(field.label);
      setHelpText(field.help_text || '');
      setPlaceholder(field.placeholder || '');
      setRequired(field.required);
      setSpan(field.span);
    } else {
      // Reset for new field
      setType('ShortText');
      setKey('');
      setLabel('');
      setHelpText('');
      setPlaceholder('');
      setRequired(false);
      setSpan(1);
    }
  }, [field, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      alert('Label is required');
      return;
    }

    if (!key.trim()) {
      alert('Key is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        key: key.trim(),
        type,
        label: label.trim(),
        help_text: helpText.trim() || null,
        placeholder: placeholder.trim() || null,
        required,
        span,
      });
      onOpenChange(false);
    } catch (error) {
      alert('Failed to save field');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-generate key from label if creating new field
  const handleLabelChange = (value: string) => {
    setLabel(value);
    if (!field && !key) {
      // Auto-generate key from label
      const autoKey = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      setKey(autoKey);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>
            Configure the field properties. All fields are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ShortText">Short Text</SelectItem>
                  <SelectItem value="LongText">Long Text</SelectItem>
                  <SelectItem value="Toggle">Toggle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-key">Field Key *</Label>
              <Input
                id="field-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="field_name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, underscores)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-label">Label *</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Displayed to users"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-help">Help Text</Label>
            <Textarea
              id="field-help"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Optional guidance for users"
              rows={2}
            />
          </div>

          {type !== 'Toggle' && (
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Example text shown in empty field"
              />
            </div>
          )}

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="field-required"
                checked={required}
                onCheckedChange={setRequired}
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Required
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="field-span">Column Span:</Label>
              <Select value={String(span)} onValueChange={(v) => setSpan(Number(v) as 1 | 2)}>
                <SelectTrigger id="field-span" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Field'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
