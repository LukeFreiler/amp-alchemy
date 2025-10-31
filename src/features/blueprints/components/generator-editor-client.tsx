/**
 * Generator Editor Client Component
 *
 * Full-page editor for blueprint generators with 2-panel layout
 */

'use client';

import { useState, useRef, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/components/ui/toaster';
import { BlueprintWithSections } from '@/features/blueprints/types/blueprint';
import { BlueprintArtifactGenerator, OutputFormat } from '@/features/blueprints/types/generator';
import { useTokenAutocomplete } from '@/features/blueprints/hooks/use-token-autocomplete';
import { TokenAutocompleteMenu } from './token-autocomplete-menu';

interface GeneratorEditorClientProps {
  blueprint: BlueprintWithSections;
  generator: BlueprintArtifactGenerator | null;
  mode: 'create' | 'edit';
}

export function GeneratorEditorClient({ blueprint, generator, mode }: GeneratorEditorClientProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState(generator?.name || '');
  const [description, setDescription] = useState(generator?.description || '');
  const [promptTemplate, setPromptTemplate] = useState(generator?.prompt_template || '');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    generator?.output_format || 'Markdown'
  );
  const [visible, setVisible] = useState(generator?.visible_in_data_room ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform blueprint sections into token array
  const tokens = useMemo(() => {
    const fieldTokens = blueprint.sections.flatMap((section) =>
      section.fields.map((field) => ({
        tag: `{{field:${field.key}}}`,
        label: field.label,
        help: field.help_text,
        section: section.title,
        type: field.type,
        isUtility: false,
      }))
    );

    const utilityTokens = [];

    // Add section-level tokens (all fields in a section)
    blueprint.sections.forEach((section) => {
      utilityTokens.push({
        tag: `{{section:${section.key}}}`,
        label: `All ${section.title} Fields`,
        help: 'Includes all field values from this section in a formatted list',
        section: 'Utilities',
        type: 'Utility' as const,
        isUtility: true,
      });
    });

    // Add section notes tokens
    blueprint.sections.forEach((section) => {
      utilityTokens.push({
        tag: `{{notes:${section.key}}}`,
        label: `${section.title} Notes`,
        help: 'Includes the notes/comments for this section',
        section: 'Utilities',
        type: 'Utility' as const,
        isUtility: true,
      });
    });

    // Add legacy "All Input" tokens for backward compatibility
    utilityTokens.push({
      tag: '{{fields_json}}',
      label: 'All Fields (JSON)',
      help: 'All field values as a JSON object (legacy format)',
      section: 'Utilities',
      type: 'Utility' as const,
      isUtility: true,
    });

    utilityTokens.push({
      tag: '{{notes_json}}',
      label: 'All Notes (JSON)',
      help: 'All section notes as a JSON object (legacy format)',
      section: 'Utilities',
      type: 'Utility' as const,
      isUtility: true,
    });

    return [...utilityTokens, ...fieldTokens];
  }, [blueprint]);

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find start of {{ trigger
    let triggerStart = start;
    const textBeforeCursor = promptTemplate.substring(0, start);
    const lastTriggerIndex = textBeforeCursor.lastIndexOf('{{');

    if (lastTriggerIndex !== -1 && !textBeforeCursor.substring(lastTriggerIndex).includes('}}')) {
      // We're in the middle of typing a token, replace from {{ onwards
      triggerStart = lastTriggerIndex;
    }

    const before = promptTemplate.substring(0, triggerStart);
    const after = promptTemplate.substring(end);

    setPromptTemplate(before + token + after);

    // Set cursor position after inserted token
    setTimeout(() => {
      textarea.focus();
      const newPosition = before.length + token.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const autocomplete = useTokenAutocomplete({
    textareaRef,
    value: promptTemplate,
    onInsert: handleInsertToken,
    tokens,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !promptTemplate.trim()) {
      toast.error('Name and prompt template are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        mode === 'create'
          ? `/api/v1/blueprints/${blueprint.id}/generators`
          : `/api/v1/blueprints/${blueprint.id}/generators/${generator?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          prompt_template: promptTemplate.trim(),
          output_format: outputFormat,
          visible_in_data_room: visible,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(
          mode === 'create' ? 'Artifact Generator created' : 'Artifact Generator updated'
        );
        router.push(`/blueprints/${blueprint.id}/edit`);
      } else {
        toast.error(result.error?.message || 'Failed to save artifact generator');
      }
    } catch (error) {
      console.error('Failed to save artifact generator:', error);
      toast.error('Failed to save artifact generator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = promptTemplate.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-[calc(100vh-var(--topbar-height,4rem))] flex-col"
    >
      <PageHeader
        title={mode === 'create' ? 'New Artifact Generator' : 'Edit Artifact Generator'}
        subtitle={blueprint.name}
        backHref={`/blueprints/${blueprint.id}/edit`}
        actions={
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Artifact Generator'}
          </Button>
        }
      />

      {/* 2-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-96 overflow-y-auto border-r border-border bg-card p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Artifact Generator Name *</Label>
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
                rows={3}
                placeholder="Brief description of what this generator produces"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(val) => setOutputFormat(val as OutputFormat)}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Markdown">Markdown</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Visible in Data Room</Label>
              <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
            </div>
          </div>
        </div>

        {/* Right Panel - Prompt Editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Editor Header */}
          <div className="border-b border-border bg-card px-6 py-4">
            <h2 className="text-base font-semibold">Prompt Template</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Type{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                {'{'}
                {'{'}
              </code>{' '}
              to insert blueprint field data dynamically
            </p>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <Textarea
              ref={textareaRef}
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              onKeyDown={autocomplete.handleKeyDown}
              className="h-full min-h-[500px] resize-none font-mono text-sm"
              required
              placeholder="Enter your prompt template here...&#10;&#10;Type '{{' to insert blueprint field tokens.&#10;&#10;Example:&#10;Create a comprehensive test plan for {{project_name}}.&#10;&#10;Target Audience: {{target_audience}}&#10;Timeline: {{timeline}}&#10;&#10;Include sections for test scope, participant criteria, and success metrics."
            />

            {/* Inline autocomplete menu */}
            {autocomplete.isOpen && autocomplete.cursorPosition && (
              <TokenAutocompleteMenu
                isOpen={autocomplete.isOpen}
                tokens={autocomplete.filteredTokens}
                selectedIndex={autocomplete.selectedIndex}
                cursorPosition={autocomplete.cursorPosition}
                textareaRef={textareaRef}
                onSelect={autocomplete.handleInsert}
                onClose={autocomplete.handleClose}
                onHover={autocomplete.handleHover}
                onClearHover={autocomplete.handleClearHover}
                onUpdateNavigableCount={autocomplete.handleUpdateNavigableCount}
                onExposeGetTag={autocomplete.handleExposeGetTag}
              />
            )}
          </div>

          {/* Editor Footer */}
          <div className="border-t border-border bg-card px-6 py-2 text-xs text-muted-foreground">
            {characterCount.toLocaleString()} characters
          </div>
        </div>
      </div>
    </form>
  );
}
