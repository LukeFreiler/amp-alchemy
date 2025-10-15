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
    <div className="space-y-2 p-4">
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
      <div className="mt-4 space-y-1">
        {sections.map((section, index) => {
          const isActive = index === currentIndex;
          const completionPercent = section.completion_percentage;

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(index)}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left transition-colors',
                isActive
                  ? 'bg-selected font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-hover'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 flex-shrink-0 rounded-full',
                    completionPercent === 100
                      ? 'bg-emerald-500'
                      : completionPercent > 0
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground/30'
                  )}
                />
                <span className="truncate text-sm">{section.title}</span>
              </div>
              <div className="ml-4 mt-1 text-xs text-muted-foreground">
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
      <div className="mt-6 space-y-1 border-t pt-4 text-xs text-muted-foreground">
        <div className="mb-2 font-medium">Keyboard Shortcuts</div>
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
