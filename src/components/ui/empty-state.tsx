import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Empty State Component
 *
 * Reusable component for displaying empty states across the application
 * with consistent styling and spacing.
 *
 * Usage:
 *   <EmptyState
 *     icon={FileText}
 *     title="No items yet"
 *     description="Get started by creating your first item"
 *   />
 */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center px-8 py-16">
      <Icon className="mb-6 h-16 w-16 text-muted-foreground" />
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      <p className="max-w-md text-center text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
