/**
 * Member and role type definitions for team management
 */

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  created_at: string;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}
