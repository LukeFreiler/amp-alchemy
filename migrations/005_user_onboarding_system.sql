-- ============================================================================
-- Centercode Alchemy - User Onboarding & Team Management System
-- Migration: 005_user_onboarding_system.sql
-- ============================================================================
-- Enhances invitation system and adds support for user onboarding:
-- 1. Rename member_invitations to pending_invitations for clarity
-- 2. Add invitation_token column to members table to track accepted invitations
-- 3. Make members.company_id nullable to support onboarding flow

-- ============================================================================
-- 1. RENAME MEMBER_INVITATIONS TABLE
-- ============================================================================

ALTER TABLE member_invitations RENAME TO pending_invitations;

-- Rename indexes to match new table name
ALTER INDEX idx_member_invitations_company RENAME TO idx_pending_invitations_company;
ALTER INDEX idx_member_invitations_token RENAME TO idx_pending_invitations_token;
ALTER INDEX idx_member_invitations_email RENAME TO idx_pending_invitations_email;

-- ============================================================================
-- 2. ADD INVITATION_TOKEN TO MEMBERS TABLE
-- ============================================================================

-- Add invitation_token column to track which invitation was accepted
ALTER TABLE members
ADD COLUMN invitation_token VARCHAR(64) UNIQUE;

CREATE INDEX idx_members_invitation_token ON members(invitation_token);

-- ============================================================================
-- 3. MAKE MEMBERS.COMPANY_ID NULLABLE FOR ONBOARDING
-- ============================================================================

-- Allow company_id to be null initially so new users can sign up
-- and then be assigned to a company during onboarding
ALTER TABLE members
ALTER COLUMN company_id DROP NOT NULL;

-- ============================================================================
-- END OF MIGRATION 005
-- ============================================================================
