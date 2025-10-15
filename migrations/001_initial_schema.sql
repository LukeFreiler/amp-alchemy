-- ============================================================================
-- Centercode Alchemy - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================================
-- Creates all core tables for companies, members, blueprints, sections, fields,
-- sessions, artifacts, and audit logging with proper constraints and indexes.

-- ============================================================================
-- 1. COMPANIES
-- ============================================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. MEMBERS
-- ============================================================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  auth_id VARCHAR(255) NOT NULL UNIQUE, -- NextAuth user ID
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, email)
);

CREATE INDEX idx_members_company ON members(company_id);
CREATE INDEX idx_members_auth ON members(auth_id);

-- ============================================================================
-- 3. BLUEPRINTS
-- ============================================================================
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, name, version)
);

CREATE INDEX idx_blueprints_company ON blueprints(company_id);
CREATE INDEX idx_blueprints_status ON blueprints(status);

-- ============================================================================
-- 4. SECTIONS
-- ============================================================================
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blueprint_id, order_index)
);

CREATE INDEX idx_sections_blueprint ON sections(blueprint_id);

-- ============================================================================
-- 5. FIELDS
-- ============================================================================
CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL, -- e.g., "project_name"
  type VARCHAR(50) NOT NULL CHECK (type IN ('ShortText', 'LongText', 'Toggle')),
  label VARCHAR(255) NOT NULL,
  help_text TEXT,
  placeholder VARCHAR(255),
  required BOOLEAN DEFAULT FALSE,
  span INT NOT NULL CHECK (span IN (1, 2)), -- column span
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section_id, key),
  UNIQUE(section_id, order_index)
);

CREATE INDEX idx_fields_section ON fields(section_id);

-- ============================================================================
-- 6. BLUEPRINT ARTIFACT GENERATORS
-- ============================================================================
CREATE TABLE blueprint_artifact_generators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  output_format VARCHAR(50) NOT NULL CHECK (output_format IN ('Markdown', 'HTML')),
  visible_in_data_room BOOLEAN DEFAULT TRUE,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blueprint_id, name)
);

CREATE INDEX idx_generators_blueprint ON blueprint_artifact_generators(blueprint_id);

-- ============================================================================
-- 7. SESSIONS
-- ============================================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE RESTRICT,
  blueprint_version INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('in_progress', 'completed', 'locked')),
  completion_percent DECIMAL(5,2) DEFAULT 0.00,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_company ON sessions(company_id);
CREATE INDEX idx_sessions_blueprint ON sessions(blueprint_id);
CREATE INDEX idx_sessions_creator ON sessions(created_by);

-- ============================================================================
-- 8. SESSION FIELD VALUES
-- ============================================================================
CREATE TABLE session_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
  value TEXT,
  source_provenance JSONB, -- {source_id, offset: [start, end], confidence}
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, field_id)
);

CREATE INDEX idx_field_values_session ON session_field_values(session_id);
CREATE INDEX idx_field_values_field ON session_field_values(field_id);

-- ============================================================================
-- 9. SECTION NOTES
-- ============================================================================
CREATE TABLE section_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
  markdown TEXT,
  provenance_tags JSONB DEFAULT '[]', -- Array of {source_id, tag}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, section_id)
);

CREATE INDEX idx_notes_session ON section_notes(session_id);
CREATE INDEX idx_notes_section ON section_notes(section_id);

-- ============================================================================
-- 10. SOURCES
-- ============================================================================
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('file', 'paste', 'url')),
  filename_or_url TEXT,
  text_extracted TEXT,
  metadata JSONB DEFAULT '{}', -- file size, mime type, etc.
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sources_session ON sources(session_id);
CREATE INDEX idx_sources_creator ON sources(created_by);

-- ============================================================================
-- 11. ARTIFACTS
-- ============================================================================
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  generator_id UUID NOT NULL REFERENCES blueprint_artifact_generators(id) ON DELETE RESTRICT,
  version INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  markdown TEXT NOT NULL,
  prompt_template_hash VARCHAR(64) NOT NULL, -- SHA-256 of template
  snapshot_ref UUID, -- Reference to session snapshot (future enhancement)
  published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, generator_id, version)
);

CREATE INDEX idx_artifacts_session ON artifacts(session_id);
CREATE INDEX idx_artifacts_generator ON artifacts(generator_id);
CREATE INDEX idx_artifacts_published ON artifacts(published);

-- ============================================================================
-- 12. SHARE LINKS
-- ============================================================================
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE, -- Random secure token for URL
  allow_source_upload BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_share_links_artifact ON share_links(artifact_id);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_expires ON share_links(expires_at);

-- ============================================================================
-- 13. AUDIT LOG
-- ============================================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES members(id),
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================================================
-- 14. UPDATED_AT TRIGGERS
-- ============================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blueprints_updated_at BEFORE UPDATE ON blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generators_updated_at BEFORE UPDATE ON blueprint_artifact_generators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_values_updated_at BEFORE UPDATE ON session_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON section_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_share_links_updated_at BEFORE UPDATE ON share_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION 001
-- ============================================================================
