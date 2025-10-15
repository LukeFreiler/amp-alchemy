'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast notification provider
 *
 * Add this component to your root layout to enable toast notifications.
 * Configured with brand colors for consistent styling.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { Toaster } from '@/components/ui/toaster';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In any component
 * import { toast } from 'sonner';
 *
 * function MyComponent() {
 *   return (
 *     <button onClick={() => toast.success('Saved!')}>
 *       Save
 *     </button>
 *   );
 * }
 * ```
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex items-center gap-3 w-full rounded-lg border bg-card text-card-foreground shadow-lg p-4',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-3 py-2',
          cancelButton: 'bg-muted text-muted-foreground hover:bg-accent rounded-md px-3 py-2',
          closeButton: 'bg-background border border-border hover:bg-accent absolute right-2 top-2',
          success: 'border-success/20 bg-success/5',
          error: 'border-destructive/20 bg-destructive/5',
          warning: 'border-warning/20 bg-warning/5',
          info: 'border-info/20 bg-info/5',
        },
      }}
    />
  );
}

/**
 * Re-export toast function for convenience
 *
 * @example
 * ```tsx
 * import { toast } from '@/components/ui/toaster';
 *
 * toast.success('Changes saved');
 * toast.error('Failed to save');
 * toast.warning('Are you sure?', {
 *   action: {
 *     label: 'Confirm',
 *     onClick: () => console.log('Confirmed'),
 *   },
 * });
 * ```
 */
export { toast } from 'sonner';
