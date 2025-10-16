-- ============================================================================
-- Centercode Alchemy - Rollback Email/Password Authentication Support
-- Migration: 004_add_email_password_auth_down.sql
-- ============================================================================
-- Rollback migration 004

-- Drop password_reset_tokens table
DROP TABLE IF EXISTS password_reset_tokens;

-- Drop the partial unique index
DROP INDEX IF EXISTS idx_members_auth_id_unique;

-- Restore the unique constraint on auth_id
ALTER TABLE members
ADD CONSTRAINT members_auth_id_key UNIQUE (auth_id);

-- Make auth_id NOT NULL again
ALTER TABLE members
ALTER COLUMN auth_id SET NOT NULL;

-- Remove auth_method column
ALTER TABLE members
DROP COLUMN IF EXISTS auth_method;

-- Remove password_hash column
ALTER TABLE members
DROP COLUMN IF EXISTS password_hash;

-- ============================================================================
-- END OF ROLLBACK 004
-- ============================================================================
