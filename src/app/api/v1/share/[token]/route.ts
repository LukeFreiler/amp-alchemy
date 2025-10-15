import { NextRequest, NextResponse } from 'next/server';

import { queryOne } from '@/lib/db/query';
import { handleError, NotFoundError } from '@/lib/errors';

type ShareLinkWithArtifact = {
  id: string;
  token: string;
  artifact_id: string;
  expires_at: string | null;
  allow_source_upload: boolean;
  created_at: string;
  artifact_version: number;
  markdown: string;
  generator_id: string;
  generator_name: string;
  session_id: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const shareLink = await queryOne<ShareLinkWithArtifact>(
      `SELECT
        sl.id,
        sl.token,
        sl.artifact_id,
        sl.expires_at,
        sl.allow_source_upload,
        sl.created_at,
        a.version as artifact_version,
        a.markdown,
        a.generator_id,
        a.session_id,
        bag.name as generator_name
      FROM share_links sl
      JOIN artifacts a ON a.id = sl.artifact_id
      JOIN blueprint_artifact_generators bag ON bag.id = a.generator_id
      WHERE sl.token = $1`,
      [token]
    );

    if (!shareLink) {
      throw new NotFoundError('Share link');
    }

    // Check expiration
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'EXPIRED',
            message: 'This share link has expired',
          },
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: shareLink,
    });
  } catch (error) {
    return handleError(error);
  }
}
