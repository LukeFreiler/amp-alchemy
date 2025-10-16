-- ============================================================================
-- Centercode Alchemy - Rollback Remove Blueprint Versioning
-- Migration: 006_remove_blueprint_versioning_down.sql
-- ============================================================================
-- Restores version column to blueprints and blueprint_version to sessions.
-- Restores archived status option.

-- WARNING: This rollback will set all blueprints to version 1 and all
-- sessions to blueprint_version 1. If you need to restore specific version
-- data, you must do so manually from backups.

-- ============================================================================
-- 1. RESTORE BLUEPRINTS TABLE
-- ============================================================================

-- Drop the unique constraint without version
ALTER TABLE blueprints DROP CONSTRAINT IF EXISTS blueprints_company_id_name_key;

-- Add version column back with default value of 1
ALTER TABLE blueprints ADD COLUMN version INT NOT NULL DEFAULT 1;

-- Restore the unique constraint with version
ALTER TABLE blueprints ADD CONSTRAINT blueprints_company_id_name_version_key
  UNIQUE(company_id, name, version);

-- Update status check constraint to include 'archived'
ALTER TABLE blueprints DROP CONSTRAINT IF EXISTS blueprints_status_check;
ALTER TABLE blueprints ADD CONSTRAINT blueprints_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

-- ============================================================================
-- 2. RESTORE SESSIONS TABLE
-- ============================================================================

-- Add blueprint_version column back with default value of 1
ALTER TABLE sessions ADD COLUMN blueprint_version INT NOT NULL DEFAULT 1;

-- ============================================================================
-- END OF MIGRATION 006 ROLLBACK
-- ============================================================================
