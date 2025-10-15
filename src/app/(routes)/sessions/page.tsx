/**
 * Sessions List Page
 *
 * Displays all sessions for the current company
 */

import { requireAuth } from '@/lib/auth/middleware';
import { SessionList } from '@/features/sessions/components/session-list';

export default async function SessionsPage() {
  await requireAuth(['owner', 'editor']);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">Manage your data collection sessions</p>
      </div>

      <SessionList />
    </div>
  );
}
