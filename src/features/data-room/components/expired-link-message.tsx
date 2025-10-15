import { Clock } from 'lucide-react';

import { Card } from '@/components/ui/card';

export function ExpiredLinkMessage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md p-8 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Link Expired</h1>
        <p className="text-muted-foreground">
          This share link has expired. Please contact the person who shared it with you for a new
          link.
        </p>
      </Card>
    </div>
  );
}
