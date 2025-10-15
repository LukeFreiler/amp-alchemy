'use client';

/**
 * Section Notes Component
 *
 * Markdown editor/preview for section-level notes
 * Autosaves on blur
 */

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit3 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SectionNotesProps {
  sessionId: string;
  sectionId: string;
}

export function SectionNotes({ sessionId, sectionId }: SectionNotesProps) {
  const [markdown, setMarkdown] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [sessionId, sectionId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/sections/${sectionId}/notes`);
      const result = await response.json();

      if (result.ok) {
        setMarkdown(result.data.markdown || '');
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/v1/sessions/${sessionId}/sections/${sectionId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    saveNotes();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Section Notes</h3>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
          <Button
            variant={isPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <Edit3 className="mr-2 h-3 w-3" />
                Edit
              </>
            ) : (
              <>
                <Eye className="mr-2 h-3 w-3" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="prose prose-sm prose-invert h-full max-w-none overflow-y-auto pr-2">
            {markdown.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            ) : (
              <p className="italic text-muted-foreground">No notes yet</p>
            )}
          </div>
        ) : (
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onBlur={handleBlur}
            placeholder="Add notes for this section...

**Formatting tips:**
- Use # for headings
- Use - or * for lists
- Use **bold** and *italic*
- Use [links](url) for references"
            className="h-full resize-none font-mono text-sm"
          />
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
        <p>Notes are saved automatically when you click away</p>
        <p className="mt-1">Supports Markdown formatting</p>
      </div>
    </div>
  );
}
