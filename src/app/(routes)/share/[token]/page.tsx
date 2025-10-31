import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExpiredLinkMessage } from '@/features/data-room/components/expired-link-message';
import { InvalidLinkMessage } from '@/features/data-room/components/invalid-link-message';
import { ViewerSourceUpload } from '@/features/data-room/components/viewer-source-upload';

type ShareLinkData = {
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

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // Fetch share link data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/v1/share/${token}`, {
    cache: 'no-store',
  });

  const result = await response.json();

  // Handle expired link
  if (!result.ok && result.error?.code === 'EXPIRED') {
    return <ExpiredLinkMessage />;
  }

  // Handle invalid link
  if (!result.ok || !result.data) {
    return <InvalidLinkMessage />;
  }

  const shareLink: ShareLinkData = result.data;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Card className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold md:text-3xl">{shareLink.generator_name}</h1>
            <p className="text-sm text-muted-foreground">
              Version {shareLink.artifact_version} •{' '}
              {new Date(shareLink.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <Separator className="my-6" />

          <div className="prose prose-sm max-w-none dark:prose-invert md:prose-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{shareLink.markdown}</ReactMarkdown>
          </div>

          {shareLink.allow_source_upload && (
            <>
              <Separator className="my-8" />
              <ViewerSourceUpload token={token} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
