-- ============================================================================
-- Centercode Alchemy - Add Email/Password Authentication Support
-- Migration: 004_add_email_password_auth.sql
-- ============================================================================
-- Adds support for email/password authentication alongside OAuth:
-- 1. Add password_hash column to members table
-- 2. Add auth_method column to track authentication type
-- 3. Create password_reset_tokens table for password reset flow

-- ============================================================================
-- 1. ALTER MEMBERS TABLE
-- ============================================================================

-- Add password_hash column (nullable, for email/password auth)
ALTER TABLE members
ADD COLUMN password_hash VARCHAR(255);

-- Add auth_method column to track how user authenticates
-- Values: 'oauth', 'credentials', 'both' (user can have both methods)
ALTER TABLE members
ADD COLUMN auth_method VARCHAR(50) NOT NULL DEFAULT 'oauth'
CHECK (auth_method IN ('oauth', 'credentials', 'both'));

-- Make auth_id nullable since credentials-based users won't have OAuth provider ID
ALTER TABLE members
ALTER COLUMN auth_id DROP NOT NULL;

-- Update the unique constraint on auth_id to handle nulls
-- Drop the old unique constraint
ALTER TABLE members
DROP CONSTRAINT IF EXISTS members_auth_id_key;

-- Add a partial unique index that only enforces uniqueness for non-null auth_id values
CREATE UNIQUE INDEX idx_members_auth_id_unique
ON members(auth_id)
WHERE auth_id IS NOT NULL;

-- ============================================================================
-- 2. CREATE PASSWORD_RESET_TOKENS TABLE
-- ============================================================================

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE, -- Random secure token
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP -- Track when token was used (one-time use)
);

CREATE INDEX idx_reset_tokens_member ON password_reset_tokens(member_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ============================================================================
-- END OF MIGRATION 004
-- ============================================================================
