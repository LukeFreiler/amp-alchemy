/**
 * ShareLinksList Component
 *
 * Displays all share links for the company with revoke functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload } from 'lucide-react';
import { logger } from '@/lib/logger';

type ShareLink = {
  id: string;
  artifact_id: string;
  artifact_title: string;
  session_name: string;
  token: string;
  allow_source_upload: boolean;
  expires_at: Date | null;
  created_by: string;
  creator_name: string;
  created_at: Date;
};

export function ShareLinksList() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/v1/share-links');
      const result = await response.json();

      if (!result.ok) {
        logger.error('Failed to fetch share links', { error: result.error });
        throw new Error(result.error?.message || 'Failed to fetch share links');
      }

      setLinks(result.data);
    } catch (error) {
      logger.error('Error fetching share links', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      const response = await fetch(`/api/v1/share-links/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.ok) {
        logger.error('Failed to revoke share link', {
          share_link_id: id,
          error: result.error,
        });
        throw new Error(result.error?.message || 'Failed to revoke share link');
      }

      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (error) {
      logger.error('Error revoking share link', { share_link_id: id, error });
    } finally {
      setRevokingId(null);
    }
  };

  const isExpired = (expiresAt: Date | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading share links...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">No share links created yet.</div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <Card key={link.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{link.artifact_title}</h3>
                {isExpired(link.expires_at) && <Badge variant="destructive">Expired</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">Session: {link.session_name}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {link.expires_at
                    ? `Expires ${new Date(link.expires_at).toLocaleDateString()}`
                    : 'Never expires'}
                </span>
                <span>•</span>
                {link.allow_source_upload ? (
                  <span className="flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    Uploads allowed
                  </span>
                ) : (
                  <span>View only</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Created by {link.creator_name} on {new Date(link.created_at).toLocaleDateString()}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRevoke(link.id)}
              disabled={revokingId === link.id}
              title="Revoke share link"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
