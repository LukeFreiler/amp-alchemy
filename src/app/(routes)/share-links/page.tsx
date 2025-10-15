/**
 * Share Links Management Page
 *
 * Page for viewing and managing all share links for the company
 */

import { requireAuth } from '@/lib/auth/middleware';
import { ShareLinksList } from '@/features/data-room/components/share-links-list';
import { Link } from 'lucide-react';

export default async function ShareLinksPage() {
  await requireAuth(['owner', 'editor']);

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <Link className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Share Links</h1>
        </div>
        <p className="text-muted-foreground">Manage all active share links for your artifacts</p>
      </div>

      <ShareLinksList />
    </div>
  );
}
