/**
 * Invitation type definitions for team management
 */

import { MemberRole } from './member';

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  invited_by_name: string;
  expires_at: string;
  created_at: string;
}

export interface InvitationDetails {
  company_name: string;
  role: MemberRole;
  inviter_name: string;
  is_expired: boolean;
}

export interface CreateInvitationRequest {
  email: string;
  role: MemberRole;
}

export interface CreateInvitationResponse {
  id: string;
  email: string;
  role: MemberRole;
  expires_at: string;
}
