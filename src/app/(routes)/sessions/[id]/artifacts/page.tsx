/**
 * Session Artifacts Page
 *
 * Dedicated page for viewing and generating artifacts
 */

import { requireAuth } from '@/lib/auth/middleware';
import { query, queryOne } from '@/lib/db/query';
import { Session } from '@/features/sessions/types/session';
import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';
import { ArtifactsPageClient } from '@/features/artifacts/components/artifacts-page-client';

interface ArtifactsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArtifactsPage({ params }: ArtifactsPageProps) {
  const user = await requireAuth();
  const { id } = await params;

  // Fetch session
  const session = await queryOne<Session>(
    `SELECT s.*, b.name as blueprint_name
     FROM sessions s
     JOIN blueprints b ON b.id = s.blueprint_id
     WHERE s.id = $1 AND s.company_id = $2`,
    [id, user.company_id]
  );

  if (!session) {
    return (
      <div className="flex h-[calc(100vh-var(--topbar-height,4rem))] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            This session does not exist or you do not have access to it.
          </p>
        </div>
      </div>
    );
  }

  // Fetch generators for this blueprint
  const generators = await query<BlueprintArtifactGenerator>(
    'SELECT * FROM blueprint_artifact_generators WHERE blueprint_id = $1 ORDER BY order_index',
    [session.blueprint_id]
  );

  return (
    <ArtifactsPageClient
      sessionId={session.id}
      sessionName={session.name}
      blueprintName={session.blueprint_name}
      generators={generators}
    />
  );
}
