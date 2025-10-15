-- ============================================================================
-- Rollback Migration: 003_add_member_invitations.sql
-- ============================================================================

DROP TRIGGER IF EXISTS update_member_invitations_updated_at ON member_invitations;
DROP TABLE IF EXISTS member_invitations;
