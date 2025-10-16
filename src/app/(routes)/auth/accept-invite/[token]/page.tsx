/**
 * Invitation acceptance page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { InvitationDetails } from '@/features/team/types';

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validateInvitation() {
      try {
        const response = await fetch(`/api/v1/invitations/validate/${token}`);
        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.error?.message || 'Invalid invitation');
        }

        setInvitation(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    }

    validateInvitation();
  }, [token]);

  async function handleAccept() {
    setIsAccepting(true);

    try {
      const response = await fetch(`/api/v1/invitations/accept/${token}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Failed to accept invitation');
      }

      toast.success('Invitation accepted! Welcome to the team');
      router.push('/sessions');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-muted-foreground">{error || 'This invitation could not be found'}</p>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  if (invitation.is_expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation Expired</h1>
          <p className="text-muted-foreground">
            This invitation has expired. Please contact{' '}
            {invitation.inviter_name} for a new invitation.
          </p>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">You&apos;ve Been Invited</h1>
          <p className="mt-2 text-muted-foreground">
            Join {invitation.company_name} on Centercode Alchemy
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Invited by</p>
            <p className="font-medium">{invitation.inviter_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{invitation.company_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Role</p>
            <p className="font-medium capitalize">{invitation.role}</p>
          </div>
        </div>

        <Button onClick={handleAccept} className="w-full" disabled={isAccepting}>
          {isAccepting ? 'Accepting...' : 'Accept Invitation'}
        </Button>
      </div>
    </div>
  );
}
