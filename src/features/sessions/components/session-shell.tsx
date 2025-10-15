'use client';

/**
 * Session Shell Component
 *
 * 3-panel layout: Left rail (sections), Center canvas (fields), Right rail (notes)
 * Handles section navigation and keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SessionWithSections } from '@/features/sessions/types/session';
import { ImportModal } from '@/features/sources/components/import-modal';
import { SourcesList } from '@/features/sources/components/sources-list';
import { SuggestionBanner } from '@/features/ai/components/suggestion-banner';
import { GenerateButton } from '@/features/artifacts/components/generate-button';
import { Generator } from '@/features/artifacts/types/artifact';
import { SectionNav } from './section-nav';
import { SectionNotes } from './section-notes';
import { SessionFooter } from './session-footer';
import { FieldGrid } from './field-grid';

interface SessionShellProps {
  sessionData: SessionWithSections;
  generators: Generator[];
}

export function SessionShell({ sessionData, generators }: SessionShellProps) {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [sourcesRefresh, setSourcesRefresh] = useState(0);
  const [showSources, setShowSources] = useState(true);
  const currentSection = sessionData.sections[currentSectionIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSectionIndex((prev) => Math.min(prev + 1, sessionData.sections.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSectionIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionData.sections.length]);

  const handleBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < sessionData.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handleHome = () => {
    router.push('/sessions');
  };

  const handleProgressUpdate = () => {
    // Progress updates are handled by refetching session data
    // This callback is for future enhancements
  };

  const handleImportComplete = () => {
    setImportModalOpen(false);
    setSourcesRefresh((prev) => prev + 1);
  };

  const handleValidationChange = (errorCount: number) => {
    setValidationErrors(errorCount);
  };

  const calculateOverallProgress = () => {
    const totalRequired = sessionData.sections.reduce(
      (sum, section) => sum + section.required_count,
      0
    );
    const totalFilled = sessionData.sections.reduce(
      (sum, section) => sum + section.filled_count,
      0
    );

    return totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 100;
  };

  if (!currentSection) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No sections available</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="border-b bg-navbar p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{sessionData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {sessionData.blueprint_name} • v{sessionData.blueprint_version}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <GenerateButton sessionId={sessionData.id} generators={generators} />
            <div className="text-sm text-muted-foreground">
              {calculateOverallProgress()}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left rail - Section navigation */}
        <aside className="w-64 overflow-y-auto border-r bg-sidebar">
          <SectionNav
            sections={sessionData.sections}
            currentIndex={currentSectionIndex}
            onSelectSection={setCurrentSectionIndex}
            overallProgress={calculateOverallProgress()}
          />
        </aside>

        {/* Center canvas - Current section fields */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl">
            {/* Sources section */}
            {showSources && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sources</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSources(false)}
                    className="text-xs"
                  >
                    Hide
                  </Button>
                </div>
                <SourcesList sessionId={sessionData.id} refreshTrigger={sourcesRefresh} />
              </div>
            )}

            {!showSources && (
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSources(true)}
                  className="text-xs"
                >
                  Show Sources
                </Button>
              </div>
            )}

            {/* AI Suggestions Banner */}
            <SuggestionBanner
              sessionId={sessionData.id}
              onSuggestionsReviewed={() => setSourcesRefresh((prev) => prev + 1)}
            />

            <h2 className="mb-4 text-2xl font-semibold">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="mb-6 text-muted-foreground">{currentSection.description}</p>
            )}

            {/* Field Grid */}
            <FieldGrid
              sessionId={sessionData.id}
              sectionId={currentSection.id}
              onProgressUpdate={handleProgressUpdate}
              onValidationChange={handleValidationChange}
            />
          </div>
        </main>

        {/* Right rail - Section notes */}
        <aside className="w-96 overflow-y-auto border-l bg-sidebar">
          <SectionNotes
            sessionId={sessionData.id}
            sectionId={currentSection.id}
            key={currentSection.id} // Force remount on section change
          />
        </aside>
      </div>

      {/* Sticky footer */}
      <SessionFooter
        currentIndex={currentSectionIndex}
        totalSections={sessionData.sections.length}
        onBack={handleBack}
        onNext={handleNext}
        onHome={handleHome}
        validationErrors={validationErrors}
      />

      {/* Import modal */}
      <ImportModal
        sessionId={sessionData.id}
        open={importModalOpen}
        onClose={handleImportComplete}
      />
    </div>
  );
}
