import { AlertCircle } from 'lucide-react';

import { Card } from '@/components/ui/card';

export function InvalidLinkMessage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Invalid Link</h1>
        <p className="text-muted-foreground">
          This share link does not exist or is no longer valid. Please contact the person who shared
          it with you.
        </p>
      </Card>
    </div>
  );
}
