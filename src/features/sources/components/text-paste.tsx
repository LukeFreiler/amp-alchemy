'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type TextPasteProps = {
  sessionId: string;
  onComplete: () => void;
};

const MAX_LENGTH = 50000;

export function TextPaste({ sessionId, onComplete }: TextPasteProps) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('text', text);

      const response = await fetch(`/api/v1/sessions/${sessionId}/sources`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save text');
      }

      setSaving(false);
      onComplete();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to save text');
    }
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_LENGTH;

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here..."
        rows={12}
        className="font-mono text-sm"
        disabled={saving}
      />

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
          {characterCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()} characters
        </span>

        <Button onClick={handleSave} disabled={!text.trim() || saving || isOverLimit}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
