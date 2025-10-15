/**
 * PublishButton Component
 *
 * Button to mark an artifact as published (visible in Data Room)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

type PublishButtonProps = {
  artifactId: string;
  isPublished: boolean;
  onPublishChange?: (published: boolean) => void;
};

export function PublishButton({
  artifactId,
  isPublished,
  onPublishChange,
}: PublishButtonProps) {
  const [published, setPublished] = useState(isPublished);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async () => {
    if (published) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/artifacts/${artifactId}/publish`,
        {
          method: 'PUT',
        }
      );

      const result = await response.json();

      if (!result.ok) {
        logger.error('Failed to publish artifact', {
          artifact_id: artifactId,
          error: result.error,
        });
        throw new Error(result.error?.message || 'Failed to publish artifact');
      }

      setPublished(true);
      onPublishChange?.( true);
    } catch (error) {
      logger.error('Error publishing artifact', {
        artifact_id: artifactId,
        error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={published || isLoading}
      variant={published ? 'outline' : 'default'}
      size="sm"
    >
      {published ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Published
        </>
      ) : (
        <>
          <Upload className="w-4 h-4 mr-2" />
          {isLoading ? 'Publishing...' : 'Publish to Data Room'}
        </>
      )}
    </Button>
  );
}
