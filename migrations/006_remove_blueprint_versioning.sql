-- ============================================================================
-- Centercode Alchemy - Remove Blueprint Versioning
-- Migration: 006_remove_blueprint_versioning.sql
-- ============================================================================
-- Removes version column from blueprints and blueprint_version from sessions.
-- Simplifies blueprint status to just draft/published (removes archived).
-- This allows direct editing of published blueprints without creating versions.

-- Before running this migration, ensure you have only one version of each
-- blueprint that you want to keep, or manually consolidate versions.

-- ============================================================================
-- 1. CLEAN UP EXISTING DATA
-- ============================================================================

-- Delete all archived blueprints (keeping only draft and published)
DELETE FROM blueprints WHERE status = 'archived';

-- For blueprints with the same name, keep only the highest version
-- (This handles cases where multiple versions exist)
DELETE FROM blueprints b1
WHERE EXISTS (
  SELECT 1 FROM blueprints b2
  WHERE b2.company_id = b1.company_id
    AND b2.name = b1.name
    AND b2.version > b1.version
);

-- ============================================================================
-- 2. UPDATE BLUEPRINTS TABLE
-- ============================================================================

-- Drop the existing unique constraint that includes version
ALTER TABLE blueprints DROP CONSTRAINT IF EXISTS blueprints_company_id_name_version_key;

-- Drop the version column
ALTER TABLE blueprints DROP COLUMN version;

-- Add new unique constraint without version
ALTER TABLE blueprints ADD CONSTRAINT blueprints_company_id_name_key UNIQUE(company_id, name);

-- Update status check constraint to remove 'archived'
ALTER TABLE blueprints DROP CONSTRAINT IF EXISTS blueprints_status_check;
ALTER TABLE blueprints ADD CONSTRAINT blueprints_status_check
  CHECK (status IN ('draft', 'published'));

-- ============================================================================
-- 3. UPDATE SESSIONS TABLE
-- ============================================================================

-- Drop the blueprint_version column from sessions
ALTER TABLE sessions DROP COLUMN blueprint_version;

-- ============================================================================
-- END OF MIGRATION 006
-- ============================================================================
