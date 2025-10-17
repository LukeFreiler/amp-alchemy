'use client';

import { useState, FormEvent } from 'react';
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
import { BlueprintArtifactGenerator, OutputFormat } from '@/features/blueprints/types/generator';

interface GeneratorModalProps {
  generator?: BlueprintArtifactGenerator;
  blueprintId: string;
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

export function GeneratorModal({ generator, open, onSave, onClose }: GeneratorModalProps) {
  const [name, setName] = useState(generator?.name || '');
  const [description, setDescription] = useState(generator?.description || '');
  const [promptTemplate, setPromptTemplate] = useState(generator?.prompt_template || '');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    generator?.output_format || 'Markdown'
  );
  const [visible, setVisible] = useState(generator?.visible_in_data_room ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <DialogTitle>{generator ? 'Edit Generator' : 'Add Generator'}</DialogTitle>
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
              <Label htmlFor="prompt">Prompt Template *</Label>
              <Textarea
                id="prompt"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                required
                placeholder="Enter your prompt template here..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use <code className="rounded bg-muted px-1">{'{{fields_json}}'}</code> to inject
                session field values and{' '}
                <code className="rounded bg-muted px-1">{'{{notes_json}}'}</code> for section notes.
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
