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
  requiredProgress: number;
  overallProgress: number;
}

export function SectionNav({
  sections,
  currentIndex,
  onSelectSection,
  requiredProgress,
  overallProgress,
}: SectionNavProps) {
  // Check if there are any required fields across all sections
  const hasRequiredFields = sections.some((section) => section.required_count > 0);

  return (
    <div className="space-y-2 p-4">
      {/* Overall progress */}
      <div className="mb-4">
        <div className="text-sm font-medium text-muted-foreground">Progress</div>
        <div className="text-sm text-muted-foreground">
          {hasRequiredFields ? (
            <>
              {requiredProgress}% required • {overallProgress}% overall
            </>
          ) : (
            <>{overallProgress}% complete</>
          )}
        </div>
        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          {hasRequiredFields ? (
            <>
              {/* Background layer: overall progress (lighter) */}
              <div
                className="absolute inset-0 h-2 rounded-full bg-primary/30 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
              {/* Foreground layer: required progress (primary) */}
              <div
                className="absolute inset-0 h-2 rounded-full bg-primary transition-all"
                style={{ width: `${requiredProgress}%` }}
              />
            </>
          ) : (
            /* Single bar: overall progress only */
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Section list */}
      <nav className="mt-4 space-y-1" role="navigation" aria-label="Section navigation">
        {sections.map((section, index) => {
          const isActive = index === currentIndex;
          const requiredComplete = section.completion_percentage === 100;
          const hasProgress = section.required_filled_count > 0 || section.total_filled_count > 0;

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(index)}
              aria-current={isActive ? 'page' : undefined}
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
                    requiredComplete
                      ? 'bg-emerald-500'
                      : hasProgress
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground/30'
                  )}
                />
                <span className="truncate text-sm">{section.title}</span>
              </div>
              <div className="ml-4 mt-1 text-xs text-muted-foreground">
                {section.required_count > 0 ? (
                  <>
                    {section.required_filled_count}/{section.required_count} required •{' '}
                    {section.total_filled_count}/{section.total_count} total
                  </>
                ) : section.total_count > 0 ? (
                  <>
                    {section.total_filled_count}/{section.total_count} total (no required)
                  </>
                ) : (
                  'No fields'
                )}
              </div>
            </button>
          );
        })}
      </nav>

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
