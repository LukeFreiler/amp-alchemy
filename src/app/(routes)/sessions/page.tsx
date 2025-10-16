/**
 * Sessions List Page
 *
 * Displays all sessions for the current company
 * All authenticated users can view sessions
 */

import { requireAuth } from '@/lib/auth/middleware';
import { SessionList } from '@/features/sessions/components/session-list';

export default async function SessionsPage() {
  await requireAuth();

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <SessionList />
    </div>
  );
}
