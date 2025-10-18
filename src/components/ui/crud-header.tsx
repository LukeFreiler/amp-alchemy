import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CrudHeaderProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: LucideIcon;
  onButtonClick: () => void;
  showSeparator?: boolean;
  quickActions?: ReactNode;
}

/**
 * CRUD Header Component
 *
 * Reusable header for list pages with title, description, action button,
 * and optional separator (shown when there are items in the list).
 *
 * Usage:
 *   <CrudHeader
 *     title="Blueprints"
 *     description="Reusable templates for collecting structured data"
 *     buttonText="New Blueprint"
 *     buttonIcon={Plus}
 *     onButtonClick={() => router.push('/blueprints/new')}
 *     showSeparator={items.length > 0}
 *   />
 */
export function CrudHeader({
  title,
  description,
  buttonText,
  buttonIcon: Icon,
  onButtonClick,
  showSeparator = false,
  quickActions,
}: CrudHeaderProps) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {quickActions && (
            <>
              {quickActions}
              <Separator orientation="vertical" className="h-8" />
            </>
          )}
          <Button onClick={onButtonClick}>
            <Icon className="h-4 w-4" />
            {buttonText}
          </Button>
        </div>
      </div>
      {showSeparator && <Separator gradient className="mb-6" />}
    </>
  );
}
