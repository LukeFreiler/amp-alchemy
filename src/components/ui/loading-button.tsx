import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;
}

/**
 * Button with loading state support
 *
 * Displays a spinner and disables interaction when loading.
 * The button maintains its size when loading to prevent layout shift.
 *
 * @example
 * ```tsx
 * const [loading, setLoading] = useState(false);
 *
 * <LoadingButton loading={loading} onClick={handleSubmit}>
 *   Submit
 * </LoadingButton>
 * ```
 */
export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(loading && 'cursor-wait', className)}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';
