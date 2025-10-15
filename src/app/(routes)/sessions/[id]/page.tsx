/**
 * Session Detail Page
 *
 * 3-panel layout for session execution
 */

import { requireAuth } from '@/lib/auth/middleware';
import { SessionShell } from '@/features/sessions/components/session-shell';

interface SessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  await requireAuth(['owner', 'editor']);

  const { id } = await params;

  // Fetch session data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/sessions/${id}`,
    {
      cache: 'no-store',
    }
  );

  const result = await response.json();

  if (!result.ok) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="mt-2 text-muted-foreground">{result.error.message}</p>
        </div>
      </div>
    );
  }

  // Fetch generators for this blueprint
  const generatorsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/blueprints/${result.data.blueprint_id}/generators`,
    {
      cache: 'no-store',
    }
  );

  const generatorsResult = await generatorsResponse.json();
  const generators = generatorsResult.ok ? generatorsResult.data : [];

  return <SessionShell sessionData={result.data} generators={generators} />;
}
