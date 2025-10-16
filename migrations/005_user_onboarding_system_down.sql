-- ============================================================================
-- Centercode Alchemy - Rollback User Onboarding & Team Management System
-- Migration: 005_user_onboarding_system_down.sql
-- ============================================================================

-- ============================================================================
-- 1. RESTORE MEMBERS.COMPANY_ID AND ROLE NOT NULL CONSTRAINTS
-- ============================================================================

-- Note: These will fail if there are members without company_id or role
-- Clean up orphaned members before rolling back
ALTER TABLE members
ALTER COLUMN role SET NOT NULL;

ALTER TABLE members
ALTER COLUMN company_id SET NOT NULL;

-- ============================================================================
-- 2. REMOVE INVITATION_TOKEN FROM MEMBERS TABLE
-- ============================================================================

DROP INDEX IF EXISTS idx_members_invitation_token;

ALTER TABLE members
DROP COLUMN invitation_token;

-- ============================================================================
-- 3. RENAME PENDING_INVITATIONS BACK TO MEMBER_INVITATIONS
-- ============================================================================

-- Rename indexes back to original names
ALTER INDEX idx_pending_invitations_company RENAME TO idx_member_invitations_company;
ALTER INDEX idx_pending_invitations_token RENAME TO idx_member_invitations_token;
ALTER INDEX idx_pending_invitations_email RENAME TO idx_member_invitations_email;

ALTER TABLE pending_invitations RENAME TO member_invitations;

-- ============================================================================
-- END OF ROLLBACK 005
-- ============================================================================
