/**
 * Session Detail Page
 *
 * 3-panel layout for session execution
 * All authenticated users can view sessions
 */

import { requireAuth } from '@/lib/auth/middleware';
import { SessionShell } from '@/features/sessions/components/session-shell';
import { query, queryOne } from '@/lib/db/query';
import { SessionWithSections, SectionWithProgress } from '@/features/sessions/types/session';
import { BlueprintArtifactGenerator } from '@/features/blueprints/types/generator';
import { Session } from '@/features/sessions/types/session';

interface SessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const user = await requireAuth();

  const { id } = await params;

  // Fetch session directly from database
  const session = await queryOne<Session>(
    `SELECT s.*, b.name as blueprint_name
     FROM sessions s
     JOIN blueprints b ON b.id = s.blueprint_id
     WHERE s.id = $1 AND s.company_id = $2`,
    [id, user.company_id]
  );

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            This session does not exist or you do not have access to it.
          </p>
        </div>
      </div>
    );
  }

  // Fetch sections with progress tracking
  const sections = await query<SectionWithProgress>(
    `SELECT
      s.*,
      COALESCE(
        (SELECT COUNT(*)::int
         FROM fields f
         WHERE f.section_id = s.id AND f.required = true),
        0
      ) as required_count,
      COALESCE(
        (SELECT COUNT(*)::int
         FROM session_field_values sfv
         JOIN fields f ON f.id = sfv.field_id
         WHERE sfv.session_id = $1
           AND f.section_id = s.id
           AND f.required = true
           AND sfv.value IS NOT NULL
           AND sfv.value != ''),
        0
      ) as filled_count,
      0 as completion_percentage
     FROM sections s
     WHERE s.blueprint_id = $2
     ORDER BY s.order_index`,
    [id, session.blueprint_id]
  );

  // Calculate completion percentages
  const sectionsWithProgress = sections.map((section) => ({
    ...section,
    completion_percentage:
      section.required_count > 0
        ? Math.round((section.filled_count / section.required_count) * 100)
        : 100,
  }));

  const sessionData: SessionWithSections = {
    ...session,
    sections: sectionsWithProgress,
  };

  // Fetch generators for this blueprint
  const generators = await query<BlueprintArtifactGenerator>(
    'SELECT * FROM blueprint_artifact_generators WHERE blueprint_id = $1 ORDER BY order_index',
    [session.blueprint_id]
  );

  return <SessionShell sessionData={sessionData} generators={generators} />;
}
