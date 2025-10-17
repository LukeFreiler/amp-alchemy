/**
 * Search API Route
 *
 * GET /api/v1/search?q={query} - Search across blueprints, sessions, and artifacts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { handleError, ValidationError } from '@/lib/errors';
import { query } from '@/lib/db/query';
import { logger } from '@/lib/logger';

type SearchResultType = 'blueprint' | 'session' | 'artifact';

type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string;
  href: string;
};

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

/**
 * GET /api/v1/search
 *
 * Search across blueprints, sessions, and artifacts
 * Returns up to 30 results (10 per type) with relevance ranking
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['owner', 'editor', 'viewer']);
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    // Validate query parameter
    if (!q || q.trim().length === 0) {
      throw new ValidationError('Search query is required');
    }

    if (q.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    const searchTerm = `%${q.trim()}%`;
    const results: SearchResult[] = [];

    // Search blueprints (by name and description)
    const blueprints = await query<{
      id: string;
      name: string;
      description: string | null;
    }>(
      `SELECT id, name, description
       FROM blueprints
       WHERE company_id = $1
         AND (name ILIKE $2 OR description ILIKE $2)
       ORDER BY
         CASE
           WHEN name ILIKE $2 THEN 1
           WHEN description ILIKE $2 THEN 2
           ELSE 3
         END,
         updated_at DESC
       LIMIT 10`,
      [user.company_id, searchTerm]
    );

    blueprints.forEach((bp) => {
      results.push({
        type: 'blueprint',
        id: bp.id,
        title: bp.name,
        snippet: bp.description
          ? bp.description.substring(0, 100) + (bp.description.length > 100 ? '...' : '')
          : 'No description',
        href: `/blueprints/${bp.id}/edit`,
      });
    });

    // Search sessions (by name and blueprint name)
    const sessions = await query<{
      id: string;
      name: string;
      blueprint_name: string;
    }>(
      `SELECT s.id, s.name, b.name as blueprint_name
       FROM sessions s
       JOIN blueprints b ON b.id = s.blueprint_id
       WHERE s.company_id = $1
         AND (s.name ILIKE $2 OR b.name ILIKE $2)
       ORDER BY
         CASE
           WHEN s.name ILIKE $2 THEN 1
           WHEN b.name ILIKE $2 THEN 2
           ELSE 3
         END,
         s.updated_at DESC
       LIMIT 10`,
      [user.company_id, searchTerm]
    );

    sessions.forEach((session) => {
      results.push({
        type: 'session',
        id: session.id,
        title: session.name,
        snippet: `Blueprint: ${session.blueprint_name}`,
        href: `/sessions/${session.id}`,
      });
    });

    // Search artifacts (by title and content)
    const artifacts = await query<{
      id: string;
      title: string;
      markdown: string;
      session_name: string;
    }>(
      `SELECT a.id, a.title, a.markdown, s.name as session_name
       FROM artifacts a
       JOIN sessions s ON s.id = a.session_id
       WHERE s.company_id = $1
         AND (a.title ILIKE $2 OR a.markdown ILIKE $2)
       ORDER BY
         CASE
           WHEN a.title ILIKE $2 THEN 1
           WHEN a.markdown ILIKE $2 THEN 2
           ELSE 3
         END,
         a.created_at DESC
       LIMIT 10`,
      [user.company_id, searchTerm]
    );

    artifacts.forEach((artifact) => {
      results.push({
        type: 'artifact',
        id: artifact.id,
        title: artifact.title,
        snippet: artifact.markdown
          ? artifact.markdown.substring(0, 100) + (artifact.markdown.length > 100 ? '...' : '')
          : `From session: ${artifact.session_name}`,
        href: `/artifacts/${artifact.id}`,
      });
    });

    logger.info('Search completed', {
      query: q,
      company_id: user.company_id,
      results_count: results.length,
      blueprints: blueprints.length,
      sessions: sessions.length,
      artifacts: artifacts.length,
    });

    return NextResponse.json<SuccessResponse<SearchResult[]>>({
      ok: true,
      data: results,
    });
  } catch (error) {
    return handleError(error);
  }
}
