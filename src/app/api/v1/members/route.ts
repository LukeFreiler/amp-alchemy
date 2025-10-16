/**
 * Team members API endpoint
 *
 * GET /api/v1/members - List all members of the user's company
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { query } from '@/lib/db/query';
import { handleError } from '@/lib/errors';

export async function GET() {
  try {
    const user = await requireAuth();

    const members = await query<{
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
    }>(
      `SELECT id, name, email, role, created_at
       FROM members
       WHERE company_id = $1
       ORDER BY created_at ASC`,
      [user.company_id]
    );

    return NextResponse.json({
      ok: true,
      data: members,
    });
  } catch (error) {
    return handleError(error);
  }
}
