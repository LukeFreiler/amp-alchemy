/**
 * Generate Page Client Component
 *
 * 3-panel layout for artifact generation:
 * - Left: Generator selector
 * - Center: Prompt editor with token insertion
 * - Right: Live preview
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';
import { GeneratorSelector } from './generator-selector';
import { PromptEditor } from './prompt-editor';
import { PromptPreview } from './prompt-preview';
import { ArtifactReviewModal } from './artifact-review-modal';

interface GeneratePageClientProps {
  sessionId: string;
  sessionName: string;
  blueprintName: string;
  generators: BlueprintArtifactGenerator[];
  initialGeneratorId?: string;
}

export function GeneratePageClient({
  sessionId,
  sessionName,
  blueprintName,
  generators,
  initialGeneratorId,
}: GeneratePageClientProps) {
  const router = useRouter();
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string>(
    initialGeneratorId || generators[0]?.id || ''
  );
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const selectedGenerator = useMemo(
    () => generators.find((g) => g.id === selectedGeneratorId),
    [generators, selectedGeneratorId]
  );

  // Load custom prompt from localStorage or use generator template
  useEffect(() => {
    const storageKey = `generator-prompt-${sessionId}-${selectedGeneratorId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      setCustomPrompt(saved);
    } else if (selectedGenerator) {
      setCustomPrompt(selectedGenerator.prompt_template);
    }
  }, [sessionId, selectedGeneratorId, selectedGenerator]);

  // Autosave custom prompt to localStorage
  useEffect(() => {
    if (!customPrompt || !selectedGeneratorId) return;

    const storageKey = `generator-prompt-${sessionId}-${selectedGeneratorId}`;
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, customPrompt);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [customPrompt, sessionId, selectedGeneratorId]);

  const handleGenerate = () => {
    setGenerating(true);
    setShowReviewModal(true);
  };

  const handleBack = () => {
    router.push(`/sessions/${sessionId}/artifacts`);
  };

  if (!selectedGenerator) {
    return (
      <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] items-center justify-center">
        <p className="text-muted-foreground">No generator selected</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            aria-label="Back to artifacts"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Generate Artifact</h1>
            <p className="text-sm text-muted-foreground">
              {sessionName} • {blueprintName}
            </p>
          </div>
          <div className="ml-auto">
            <Button onClick={handleGenerate} disabled={generating || !customPrompt.trim()}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Tabs */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        <Tabs defaultValue="editor" className="flex flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="generator" className="flex-1 overflow-y-auto">
            <GeneratorSelector
              generators={generators}
              selectedId={selectedGeneratorId}
              onSelect={setSelectedGeneratorId}
            />
          </TabsContent>
          <TabsContent value="editor" className="flex-1 overflow-hidden">
            <PromptEditor
              sessionId={sessionId}
              value={customPrompt}
              onChange={setCustomPrompt}
            />
          </TabsContent>
          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <PromptPreview sessionId={sessionId} template={customPrompt} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout - 3 Panels */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        {/* Left Rail - Generator Selector */}
        <div className="w-80 overflow-y-auto border-r border-border bg-card">
          <GeneratorSelector
            generators={generators}
            selectedId={selectedGeneratorId}
            onSelect={setSelectedGeneratorId}
          />
        </div>

        {/* Center - Prompt Editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <PromptEditor
            sessionId={sessionId}
            value={customPrompt}
            onChange={setCustomPrompt}
          />
        </div>

        {/* Right Rail - Live Preview */}
        <div className="w-96 overflow-y-auto border-l border-border bg-card">
          <PromptPreview sessionId={sessionId} template={customPrompt} />
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedGeneratorId && (
        <ArtifactReviewModal
          sessionId={sessionId}
          generatorId={selectedGeneratorId}
          onClose={() => {
            setShowReviewModal(false);
            setGenerating(false);
          }}
        />
      )}
    </div>
  );
}
