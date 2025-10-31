/**
 * PageHeader Component
 *
 * Unified header for detail and editor pages with consistent styling and navigation
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  /**
   * Main page title
   */
  title: string | React.ReactNode;

  /**
   * Optional subtitle (e.g., "Session name • Blueprint name")
   */
  subtitle?: string;

  /**
   * Optional back navigation URL
   */
  backHref?: string;

  /**
   * Optional back button label (defaults to icon only)
   */
  backLabel?: string;

  /**
   * Optional action buttons (right-aligned)
   */
  actions?: React.ReactNode;

  /**
   * Optional custom content (for complex headers like Blueprint editor)
   */
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  children,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref as never);
    }
  };

  return (
    <div className="border-b bg-card px-6 py-4">
      <div className="flex items-center gap-4">
        {backHref && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            aria-label={backLabel || 'Go back'}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel && <span className="ml-2">{backLabel}</span>}
          </Button>
        )}

        {children ? (
          // Custom content for complex headers
          <div className="flex flex-1 items-center gap-4">{children}</div>
        ) : (
          // Standard title/subtitle layout
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
