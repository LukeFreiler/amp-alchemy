/**
 * Sessions List Page
 *
 * Displays all sessions for the current company with filtering
 * All authenticated users can view sessions
 */

import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth/middleware';
import { SessionList } from '@/features/sessions/components/session-list';
import { Session } from '@/features/sessions/types/session';
import { Blueprint } from '@/features/blueprints/types/blueprint';

export default async function SessionsPage() {
  const user = await requireAuth();

  // Get cookies to pass to internal API
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Fetch sessions
  const sessionsResponse = await fetch(`${baseUrl}/api/v1/sessions`, {
    cache: 'no-store',
    headers: {
      cookie: cookieHeader,
    },
  });

  let sessions: Session[] = [];
  if (sessionsResponse.ok) {
    const result = await sessionsResponse.json();
    if (result.ok) {
      sessions = result.data;
    }
  }

  // Fetch blueprints for filter dropdown
  const blueprintsResponse = await fetch(`${baseUrl}/api/v1/blueprints`, {
    cache: 'no-store',
    headers: {
      cookie: cookieHeader,
    },
  });

  let blueprints: Blueprint[] = [];
  if (blueprintsResponse.ok) {
    const result = await blueprintsResponse.json();
    if (result.ok) {
      blueprints = result.data;
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <SessionList initialSessions={sessions} blueprints={blueprints} currentUserId={user.id} />
    </div>
  );
}
