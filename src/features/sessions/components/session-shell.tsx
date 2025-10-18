'use client';

/**
 * Session Shell Component
 *
 * 3-panel layout: Left rail (sections), Center canvas (fields), Right rail (notes)
 * Handles section navigation and keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionWithSections } from '@/features/sessions/types/session';
import { ImportModal } from '@/features/sources/components/import-modal';
import { SuggestionBanner } from '@/features/ai/components/suggestion-banner';
import { SectionNav } from './section-nav';
import { SectionNotes } from './section-notes';
import { SessionFooter } from './session-footer';
import { FieldGrid } from './field-grid';

interface SessionShellProps {
  sessionData: SessionWithSections;
}

export function SessionShell({ sessionData }: SessionShellProps) {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);
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
    // Trigger server-side refresh to get updated progress data
    router.refresh();
  };

  const handleValidationChange = (errorCount: number) => {
    setValidationErrors(errorCount);
  };

  const calculateProgress = () => {
    const totalRequired = sessionData.sections.reduce(
      (sum, section) => sum + section.required_count,
      0
    );
    const totalRequiredFilled = sessionData.sections.reduce(
      (sum, section) => sum + section.required_filled_count,
      0
    );
    const totalFields = sessionData.sections.reduce((sum, section) => sum + section.total_count, 0);
    const totalFieldsFilled = sessionData.sections.reduce(
      (sum, section) => sum + section.total_filled_count,
      0
    );

    return {
      requiredProgress:
        totalRequired > 0 ? Math.round((totalRequiredFilled / totalRequired) * 100) : 0,
      overallProgress: totalFields > 0 ? Math.round((totalFieldsFilled / totalFields) * 100) : 0,
    };
  };

  if (!currentSection) {
    return (
      <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] items-center justify-center">
        <p className="text-muted-foreground">No sections available</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] flex-col">
      {/* Top bar */}
      <div className="border-b bg-navbar p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{sessionData.name}</h1>
            <p className="text-sm text-muted-foreground">{sessionData.blueprint_name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              aria-label="Import sources"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/sessions/${sessionData.id}/artifacts`)}
              aria-label="View artifacts"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Artifacts</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: Tab-based layout */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <Tabs defaultValue="fields" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="mt-0 flex-1 overflow-y-auto p-0">
            <SectionNav
              sections={sessionData.sections}
              currentIndex={currentSectionIndex}
              onSelectSection={setCurrentSectionIndex}
              requiredProgress={calculateProgress().requiredProgress}
              overallProgress={calculateProgress().overallProgress}
            />
          </TabsContent>

          <TabsContent value="fields" className="mt-0 flex-1 overflow-y-auto p-4">
            {/* AI Suggestions Banner */}
            <SuggestionBanner sessionId={sessionData.id} />

            <h2 className="mb-4 text-2xl font-semibold">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="mb-6 text-muted-foreground">{currentSection.description}</p>
            )}
            <Separator gradient className="mb-6" />

            {/* Field Grid */}
            <FieldGrid
              sessionId={sessionData.id}
              sectionId={currentSection.id}
              onProgressUpdate={handleProgressUpdate}
              onValidationChange={handleValidationChange}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-0 flex-1 overflow-y-auto p-0">
            <SectionNotes
              sessionId={sessionData.id}
              sectionId={currentSection.id}
              key={currentSection.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: 3-panel layout */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        {/* Left rail - Section navigation */}
        <aside className="w-64 overflow-y-auto border-r bg-sidebar">
          <SectionNav
            sections={sessionData.sections}
            currentIndex={currentSectionIndex}
            onSelectSection={setCurrentSectionIndex}
            requiredProgress={calculateProgress().requiredProgress}
            overallProgress={calculateProgress().overallProgress}
          />
        </aside>

        {/* Center canvas - Current section fields */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl">
            {/* AI Suggestions Banner */}
            <SuggestionBanner sessionId={sessionData.id} />

            <h2 className="mb-4 text-2xl font-semibold">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="mb-6 text-muted-foreground">{currentSection.description}</p>
            )}
            <Separator gradient className="mb-6" />

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
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
