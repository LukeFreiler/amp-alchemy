/**
 * Artifacts Page Client Component
 *
 * Client-side UI for viewing and generating artifacts with sidebar layout
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, RefreshCw, AlertCircle, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { Generator, Artifact, GenerateResponse } from '@/features/artifacts/types/artifact';

interface ArtifactsPageClientProps {
  sessionId: string;
  sessionName: string;
  blueprintName: string | undefined;
  generators: Generator[];
}

type ErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: string[];
  };
};

type SuccessResponse = {
  ok: true;
  data: GenerateResponse;
};

export function ArtifactsPageClient({
  sessionId,
  sessionName,
  blueprintName,
  generators,
}: ArtifactsPageClientProps) {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'artifact' | 'generator';
    id: string;
  } | null>(null);
  const [loadingArtifacts, setLoadingArtifacts] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [generatedArtifact, setGeneratedArtifact] = useState<GenerateResponse | null>(null);

  // Fetch artifacts
  useEffect(() => {
    fetchArtifacts();
  }, [sessionId]);

  const fetchArtifacts = async () => {
    setLoadingArtifacts(true);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/artifacts`);
      const result = await response.json();

      if (result.ok) {
        // API returns grouped artifacts: Record<generator_id, { artifacts: Artifact[] }>
        // Flatten into a single array
        const flatArtifacts: Artifact[] = Object.values(result.data).flatMap(
          (group) => group.artifacts
        );
        setArtifacts(flatArtifacts);
        // Auto-select first artifact if available
        if (flatArtifacts.length > 0 && !selectedItem) {
          setSelectedItem({ type: 'artifact', id: flatArtifacts[0].id });
        }
      }
    } catch (err) {
      setError('Failed to load artifacts');
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const handleGenerate = async (generatorId: string) => {
    setGenerating(true);
    setError(null);
    setMissingFields([]);
    setGeneratedArtifact(null);

    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/artifacts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generator_id: generatorId }),
      });

      const result = (await response.json()) as SuccessResponse | ErrorResponse;

      if (result.ok) {
        setGeneratedArtifact(result.data);
      } else if (result.error.code === 'MISSING_REQUIRED_FIELDS') {
        setMissingFields(result.error.fields || []);
        setError('Cannot generate artifact: missing required fields');
      } else {
        setError(result.error.message || 'Failed to generate artifact');
      }
    } catch (err) {
      setError('Network error occurred while generating artifact');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedArtifact || !selectedItem || selectedItem.type !== 'generator') return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/artifacts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generator_id: selectedItem.id,
          markdown: generatedArtifact.markdown,
          prompt_template_hash: generatedArtifact.prompt_hash,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setGeneratedArtifact(null);
        await fetchArtifacts();
        setSelectedItem({ type: 'artifact', id: result.data.id });
      } else {
        setError(result.error?.message || 'Failed to save artifact');
      }
    } catch (err) {
      setError('Network error occurred while saving artifact');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratorClick = (generatorId: string) => {
    setSelectedItem({ type: 'generator', id: generatorId });
    handleGenerate(generatorId);
  };

  const handleArtifactClick = (artifactId: string) => {
    setSelectedItem({ type: 'artifact', id: artifactId });
    setGeneratedArtifact(null);
    setError(null);
  };

  const selectedArtifact =
    selectedItem?.type === 'artifact' ? artifacts.find((a) => a.id === selectedItem.id) : null;
  const selectedGenerator =
    selectedItem?.type === 'generator' ? generators.find((g) => g.id === selectedItem.id) : null;

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] flex-col">
      {/* Header */}
      <div className="border-b bg-navbar p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sessions/${sessionId}`)}
            aria-label="Back to session"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Artifacts</h1>
            <p className="text-sm text-muted-foreground">
              {sessionName} • {blueprintName || 'Blueprint'}
            </p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Generators and Artifacts */}
        <aside className="w-64 overflow-y-auto border-r bg-sidebar">
          <div className="p-4">
            {/* Generators section */}
            {generators.length > 0 && (
              <>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Generators</h2>
                <div className="space-y-1">
                  {generators.map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => handleGeneratorClick(gen.id)}
                      disabled={generating}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                        selectedItem?.type === 'generator' && selectedItem.id === gen.id
                          ? 'bg-accent'
                          : ''
                      } ${generating ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <Sparkles className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{gen.name}</span>
                    </button>
                  ))}
                </div>
                <hr className="my-4" />
              </>
            )}

            {/* Artifacts section */}
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Saved Artifacts</h2>
            {loadingArtifacts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : artifacts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No saved artifacts yet
              </p>
            ) : (
              <div className="space-y-1">
                {artifacts.map((artifact) => (
                  <button
                    key={artifact.id}
                    onClick={() => handleArtifactClick(artifact.id)}
                    className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      selectedItem?.type === 'artifact' && selectedItem.id === artifact.id
                        ? 'bg-accent'
                        : ''
                    }`}
                  >
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{artifact.title}</div>
                      <div className="text-xs text-muted-foreground">
                        v{artifact.version} •{' '}
                        {new Date(artifact.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    {artifact.published && (
                      <Eye className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl">
            {!selectedItem ? (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <div>
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Select a generator or artifact from the sidebar</p>
                </div>
              </div>
            ) : selectedItem.type === 'generator' ? (
              <>
                {/* Generator view */}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error}
                      {missingFields.length > 0 && (
                        <ul className="mt-2 list-inside list-disc">
                          {missingFields.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {generating ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Generating artifact...</p>
                    </div>
                  </div>
                ) : generatedArtifact ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {generatedArtifact.generator_name}
                        </h2>
                        <p className="text-sm text-muted-foreground">Preview</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => selectedGenerator && handleGenerate(selectedGenerator.id)}
                          disabled={generating || saving}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                        <Button onClick={handleSave} disabled={generating || saving}>
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Artifact'
                          )}
                        </Button>
                      </div>
                    </div>

                    <Tabs defaultValue="artifact">
                      <TabsList>
                        <TabsTrigger value="artifact">Artifact</TabsTrigger>
                        <TabsTrigger value="prompt">Prompt</TabsTrigger>
                      </TabsList>

                      <TabsContent value="artifact" className="mt-4">
                        <div className="prose prose-sm dark:prose-invert overflow-y-auto rounded-md border border-border bg-card p-6">
                          <ReactMarkdown>{generatedArtifact.markdown}</ReactMarkdown>
                        </div>
                      </TabsContent>

                      <TabsContent value="prompt" className="mt-4">
                        <div className="overflow-y-auto rounded-md bg-muted p-4 font-mono text-xs">
                          <pre className="whitespace-pre-wrap">{generatedArtifact.prompt}</pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : null}
              </>
            ) : selectedArtifact ? (
              <>
                {/* Artifact view */}
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold">{selectedArtifact.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>v{selectedArtifact.version}</span>
                    <span>•</span>
                    <span>
                      {new Date(selectedArtifact.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span>{selectedArtifact.creator_name}</span>
                    {selectedArtifact.published && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert rounded-md border border-border bg-card p-6">
                  <ReactMarkdown>{selectedArtifact.markdown}</ReactMarkdown>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
