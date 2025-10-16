'use client';

/**
 * Session Footer Component
 *
 * Sticky footer with navigation buttons
 */

import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionFooterProps {
  currentIndex: number;
  totalSections: number;
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  validationErrors?: number;
}

export function SessionFooter({
  currentIndex,
  totalSections,
  onBack,
  onNext,
  onHome,
  validationErrors = 0,
}: SessionFooterProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSections - 1;

  return (
    <footer className="border-t bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onHome}>
            <Home className="h-4 w-4" />
            Home
          </Button>
          {validationErrors > 0 && (
            <span className="text-sm text-destructive">
              {validationErrors} required field{validationErrors > 1 ? 's' : ''} missing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Section {currentIndex + 1} of {totalSections}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack} disabled={isFirst}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="default" onClick={onNext} disabled={isLast}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
