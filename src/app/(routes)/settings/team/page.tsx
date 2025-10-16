/**
 * Team management page (owner-only)
 */

import { requireAuth } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db/query';
import { TeamMember, Invitation } from '@/features/team/types';

export default async function TeamSettingsPage() {
  const user = await requireAuth();

  // Only owners can access team management
  if (user.role !== 'owner') {
    redirect('/sessions');
  }

  // Fetch team members
  const members = await query<TeamMember>(
    `SELECT id, name, email, role, created_at
     FROM members
     WHERE company_id = $1
     ORDER BY created_at ASC`,
    [user.company_id]
  );

  // Fetch pending invitations
  const invitations = await query<Invitation>(
    `SELECT
       pi.id,
       pi.email,
       pi.role,
       pi.expires_at,
       pi.created_at,
       m.name as invited_by_name
     FROM pending_invitations pi
     JOIN members m ON pi.invited_by = m.id
     WHERE pi.company_id = $1 AND pi.accepted_at IS NULL
     ORDER BY pi.created_at DESC`,
    [user.company_id]
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your team members and invitations
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Team Members ({members.length})</h2>
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
          <h2 className="text-xl font-semibold mb-4">
            Pending Invitations ({invitations.length})
          </h2>
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
    </div>
  );
}
