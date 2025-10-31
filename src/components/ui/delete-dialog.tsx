'use client';

/**
 * Delete Confirmation Dialog
 *
 * A specialized dialog for delete confirmations that can be dismissed by clicking outside.
 * Uses Dialog instead of AlertDialog to allow dismissal on outside clicks and Escape key.
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void;
  isDeleting?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isDeleting = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-gray-950 p-6 shadow-lg duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'sm:rounded-lg'
          )}
        >
          {/* Header */}
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <div className="text-base text-muted-foreground">{description}</div>
            </DialogPrimitive.Description>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="mt-2 sm:mt-0"
            >
              {cancelText}
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : confirmText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
