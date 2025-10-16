/**
 * Auth session and user types
 *
 * These types extend NextAuth's default session to include
 * company and role information for access control.
 */

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  company_id: string | null; // null for users who haven't completed onboarding
  role: MemberRole | null; // null for users who haven't completed onboarding
  name: string;
  email: string;
  auth_id: string | null; // OAuth provider ID (null for credentials-based users)
}

export interface Member {
  id: string;
  company_id: string | null; // null for users who haven't completed onboarding
  auth_id: string | null; // OAuth provider ID (null for credentials-based users)
  role: MemberRole | null; // null for users who haven't completed onboarding
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}
