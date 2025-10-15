/**
 * ShareModal Component
 *
 * Modal for creating and managing share links for artifacts
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, Mail } from 'lucide-react';
import { logger } from '@/lib/logger';

type ShareModalProps = {
  artifactId: string;
  open: boolean;
  onClose: () => void;
};

type ShareLink = {
  id: string;
  token: string;
  url: string;
};

export function ShareModal({ artifactId, open, onClose }: ShareModalProps) {
  const [expiresIn, setExpiresIn] = useState<string>('none');
  const [allowUploads, setAllowUploads] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const expiresInDays =
        expiresIn === 'none'
          ? null
          : expiresIn === '1'
            ? 1
            : expiresIn === '7'
              ? 7
              : expiresIn === '30'
                ? 30
                : null;

      const response = await fetch(`/api/v1/artifacts/${artifactId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expires_in_days: expiresInDays,
          allow_source_upload: allowUploads,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        logger.error('Failed to create share link', {
          artifact_id: artifactId,
          error: result.error,
        });
        throw new Error(result.error?.message || 'Failed to create share link');
      }

      setShareLink(result.data);
    } catch (error) {
      logger.error('Error creating share link', {
        artifact_id: artifactId,
        error,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error });
    }
  };

  const handleSendEmail = async () => {
    if (!shareLink || !email.trim()) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/v1/artifacts/${artifactId}/share/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          share_link_id: shareLink.id,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        logger.error('Failed to send email', {
          artifact_id: artifactId,
          error: result.error,
        });
        throw new Error(result.error?.message || 'Failed to send email');
      }

      setEmailSent(true);
      setEmail('');
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      logger.error('Error sending email', {
        artifact_id: artifactId,
        error,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setEmail('');
    setExpiresIn('none');
    setAllowUploads(false);
    setCopied(false);
    setEmailSent(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Artifact</DialogTitle>
        </DialogHeader>

        {!shareLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Never</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={allowUploads} onCheckedChange={setAllowUploads} />
              <Label className="cursor-pointer">Allow Viewer Source Uploads</Label>
            </div>

            <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Share Link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareLink.url} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && <p className="text-sm text-green-500">Copied to clipboard!</p>}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Send via Email (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="viewer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSendEmail}
                  disabled={!email.trim() || isSendingEmail}
                  title="Send email"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              {emailSent && <p className="text-sm text-green-500">Email sent successfully!</p>}
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
