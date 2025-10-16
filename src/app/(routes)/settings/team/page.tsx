/**
 * Team management page (owner-only)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { InviteUserModal } from '@/features/team/components/invite-user-modal';
import { TeamMember, Invitation } from '@/features/team/types';

export default function TeamSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    // Redirect non-owners
    if (status === 'authenticated' && session?.user?.role !== 'owner') {
      router.push('/sessions');
      return;
    }

    if (status === 'authenticated') {
      fetchTeamData();
    }
  }, [status, session, router]);

  async function fetchTeamData() {
    try {
      // Fetch team members
      const membersResponse = await fetch('/api/v1/members');
      const membersData = await membersResponse.json();

      if (membersData.ok) {
        setMembers(membersData.data);
      }

      // Fetch pending invitations
      const invitationsResponse = await fetch('/api/v1/invitations');
      const invitationsData = await invitationsResponse.json();

      if (invitationsData.ok) {
        setInvitations(invitationsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInviteSuccess() {
    fetchTeamData();
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team members and invitations
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Team Members ({members.length})</h3>
          <div className="rounded-lg border">
            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="text-sm capitalize px-3 py-1 rounded-full bg-muted">
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            Pending Invitations ({invitations.length})
          </h3>
          {invitations.length > 0 ? (
            <div className="rounded-lg border">
              <div className="divide-y">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invitation.invited_by_name} •{' '}
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm capitalize px-3 py-1 rounded-full bg-muted">
                      {invitation.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No pending invitations</p>
          )}
        </div>
      </div>

      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
}
