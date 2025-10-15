'use client';

/**
 * Session Shell Component
 *
 * 3-panel layout: Left rail (sections), Center canvas (fields), Right rail (notes)
 * Handles section navigation and keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionWithSections } from '@/features/sessions/types/session';
import { SectionNav } from './section-nav';
import { SectionNotes } from './section-notes';
import { SessionFooter } from './session-footer';

interface SessionShellProps {
  sessionData: SessionWithSections;
}

export function SessionShell({ sessionData }: SessionShellProps) {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const currentSection = sessionData.sections[currentSectionIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSectionIndex((prev) =>
          Math.min(prev + 1, sessionData.sections.length - 1)
        );
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
          <div className="text-sm text-muted-foreground">
            {calculateOverallProgress()}% Complete
          </div>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left rail - Section navigation */}
        <aside className="w-64 border-r bg-sidebar overflow-y-auto">
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
            <h2 className="text-2xl font-semibold mb-4">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="text-muted-foreground mb-6">{currentSection.description}</p>
            )}

            {/* Placeholder for fields (Epic #7) */}
            <div className="rounded-lg border bg-card p-8">
              <p className="text-center text-muted-foreground">
                Field inputs will be implemented in Epic #7
              </p>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Section: {currentSection.title}
              </p>
            </div>
          </div>
        </main>

        {/* Right rail - Section notes */}
        <aside className="w-96 border-l bg-sidebar overflow-y-auto">
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
      />
    </div>
  );
}
