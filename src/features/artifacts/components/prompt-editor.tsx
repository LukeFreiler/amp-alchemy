/**
 * Prompt Editor Component
 *
 * Rich text editor for building prompts with token insertion
 */

'use client';

import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TokenPicker } from './token-picker';
import { useTokenMetadata } from '../hooks/use-token-metadata';

interface PromptEditorProps {
  sessionId: string;
  value: string;
  onChange: (value: string) => void;
}

export function PromptEditor({ sessionId, value, onChange }: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { tokens, loading } = useTokenMetadata(sessionId);

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);

    onChange(before + token + after);

    // Set cursor position after inserted token
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + token.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+K to open token picker
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // Token picker opens via button click
    }
  };

  const characterCount = value.length;

  return (
    <div className="flex h-full flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Prompt Template</h2>
          <p className="text-xs text-muted-foreground">
            Use tokens to insert session data dynamically
          </p>
        </div>
        <TokenPicker
          tokens={tokens}
          loading={loading}
          onInsert={handleInsertToken}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Insert Token
            </Button>
          }
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden p-4">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-full resize-none font-mono text-sm"
          placeholder="Enter your prompt template here...&#10;&#10;Use tokens like {{field:project_name}} to insert session data.&#10;Press Cmd+K to open the token picker."
        />
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
        <div>
          <kbd className="rounded bg-muted px-1.5 py-0.5">Cmd</kbd> +{' '}
          <kbd className="rounded bg-muted px-1.5 py-0.5">K</kbd> to insert token
        </div>
        <div>{characterCount.toLocaleString()} characters</div>
      </div>
    </div>
  );
}
