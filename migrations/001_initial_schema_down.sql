-- ============================================================================
-- Centercode Alchemy - Rollback Initial Schema
-- Migration: 001_initial_schema_down.sql
-- ============================================================================
-- Drops all tables and triggers created by 001_initial_schema.sql
-- Run this to completely rollback the initial schema migration

-- ============================================================================
-- 1. DROP TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_share_links_updated_at ON share_links;
DROP TRIGGER IF EXISTS update_notes_updated_at ON section_notes;
DROP TRIGGER IF EXISTS update_field_values_updated_at ON session_field_values;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_generators_updated_at ON blueprint_artifact_generators;
DROP TRIGGER IF EXISTS update_fields_updated_at ON fields;
DROP TRIGGER IF EXISTS update_sections_updated_at ON sections;
DROP TRIGGER IF EXISTS update_blueprints_updated_at ON blueprints;
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;

-- ============================================================================
-- 2. DROP FUNCTION
-- ============================================================================
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================================================
-- 3. DROP TABLES (reverse dependency order)
-- ============================================================================
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS share_links;
DROP TABLE IF EXISTS artifacts;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS section_notes;
DROP TABLE IF EXISTS session_field_values;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS blueprint_artifact_generators;
DROP TABLE IF EXISTS fields;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS blueprints;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS companies;

-- ============================================================================
-- END OF ROLLBACK 001
-- ============================================================================
