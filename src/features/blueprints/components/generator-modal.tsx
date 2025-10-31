'use client';

import { useState, FormEvent, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { BlueprintArtifactGenerator, OutputFormat } from '@/features/blueprints/types/generator';
import { BlueprintWithSections } from '@/features/blueprints/types/blueprint';
import { BlueprintTokenPicker } from './blueprint-token-picker';

interface GeneratorModalProps {
  generator?: BlueprintArtifactGenerator;
  blueprintId: string;
  blueprint: BlueprintWithSections;
  open: boolean;
  onSave: (data: {
    name: string;
    description: string;
    prompt_template: string;
    output_format: OutputFormat;
    visible_in_data_room: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function GeneratorModal({
  generator,
  blueprint,
  open,
  onSave,
  onClose,
}: GeneratorModalProps) {
  const [name, setName] = useState(generator?.name || '');
  const [description, setDescription] = useState(generator?.description || '');
  const [promptTemplate, setPromptTemplate] = useState(generator?.prompt_template || '');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    generator?.output_format || 'Markdown'
  );
  const [visible, setVisible] = useState(generator?.visible_in_data_room ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = promptTemplate.substring(0, start);
    const after = promptTemplate.substring(end);

    setPromptTemplate(before + token + after);

    // Set cursor position after inserted token
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + token.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !promptTemplate.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        prompt_template: promptTemplate.trim(),
        output_format: outputFormat,
        visible_in_data_room: visible,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save generator:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {generator ? 'Edit Artifact Generator' : 'Add Artifact Generator'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Test Plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of what this generator produces"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt">Prompt Template *</Label>
                <BlueprintTokenPicker
                  blueprint={blueprint}
                  onInsert={handleInsertToken}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                      Insert Token
                    </Button>
                  }
                />
              </div>
              <Textarea
                ref={textareaRef}
                id="prompt"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                required
                placeholder="Enter your prompt template here...&#10;&#10;Use tokens like {{field:key}} to insert session field values.&#10;Click 'Insert Token' to browse available tokens."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use tokens like <code className="rounded bg-muted px-1">{'{{field:key}}'}</code> for
                individual fields or{' '}
                <code className="rounded bg-muted px-1">{'{{section:id}}'}</code> for entire
                sections.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="format">Output Format:</Label>
                <Select
                  value={outputFormat}
                  onValueChange={(val) => setOutputFormat(val as OutputFormat)}
                >
                  <SelectTrigger id="format" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Markdown">Markdown</SelectItem>
                    <SelectItem value="HTML">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
                <Label htmlFor="visible">Visible in Data Room</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
