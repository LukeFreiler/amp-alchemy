/**
 * Blueprints List Page
 *
 * Server component that fetches blueprints and renders the list
 * All authenticated users can view blueprints
 */

import { requireAuth } from '@/lib/auth/middleware';
import { BlueprintList } from '@/features/blueprints/components/blueprint-list';

export default async function BlueprintsPage() {
  const user = await requireAuth();

  // Fetch blueprints from API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/blueprints`,
    {
      cache: 'no-store',
      headers: {
        // Pass cookies for authentication
        cookie: `next-auth.session-token=${user.id}`,
      },
    }
  );

  let blueprints = [];
  if (response.ok) {
    const result = await response.json();
    if (result.ok) {
      blueprints = result.data;
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <BlueprintList blueprints={blueprints} />
    </div>
  );
}
