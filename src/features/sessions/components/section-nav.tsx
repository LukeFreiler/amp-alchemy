'use client';

/**
 * Section Navigation Component
 *
 * Left rail showing all sections with progress indicators
 */

import { SectionWithProgress } from '@/features/sessions/types/session';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SectionNavProps {
  sections: SectionWithProgress[];
  currentIndex: number;
  onSelectSection: (index: number) => void;
  overallProgress: number;
}

export function SectionNav({
  sections,
  currentIndex,
  onSelectSection,
  overallProgress,
}: SectionNavProps) {
  return (
    <div className="p-4 space-y-2">
      {/* Overall progress */}
      <div className="mb-4">
        <div className="text-sm font-medium text-muted-foreground">Overall Progress</div>
        <div className="text-2xl font-bold">{overallProgress}%</div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <Separator />

      {/* Section list */}
      <div className="space-y-1 mt-4">
        {sections.map((section, index) => {
          const isActive = index === currentIndex;
          const completionPercent = section.completion_percentage;

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(index)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-selected text-foreground font-medium'
                  : 'hover:bg-hover text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    completionPercent === 100
                      ? 'bg-emerald-500'
                      : completionPercent > 0
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground/30'
                  )}
                />
                <span className="text-sm truncate">{section.title}</span>
              </div>
              <div className="text-xs text-muted-foreground ml-4 mt-1">
                {section.required_count > 0 ? (
                  <>
                    {section.filled_count}/{section.required_count} fields • {completionPercent}%
                  </>
                ) : (
                  'No required fields'
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground space-y-1">
        <div className="font-medium mb-2">Keyboard Shortcuts</div>
        <div className="flex justify-between">
          <span>Navigate</span>
          <span className="font-mono">J / K</span>
        </div>
        <div className="flex justify-between">
          <span>Arrows</span>
          <span className="font-mono">↑ / ↓</span>
        </div>
      </div>
    </div>
  );
}
