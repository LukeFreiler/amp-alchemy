-- ============================================================================
-- Centercode Alchemy - Add Member Invitations Table
-- Migration: 003_add_member_invitations.sql
-- ============================================================================
-- Creates member_invitations table to support email-based invitations

CREATE TABLE member_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  invited_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_member_invitations_company ON member_invitations(company_id);
CREATE INDEX idx_member_invitations_token ON member_invitations(token);
CREATE INDEX idx_member_invitations_email ON member_invitations(email);

-- Add trigger for updated_at (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    EXECUTE 'CREATE TRIGGER update_member_invitations_updated_at
      BEFORE UPDATE ON member_invitations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at()';
  END IF;
END $$;
