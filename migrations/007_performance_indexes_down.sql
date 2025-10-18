-- ============================================================================
-- Centercode Alchemy - Performance Optimization Indexes (Rollback)
-- Migration: 007_performance_indexes_down.sql
-- ============================================================================

DROP INDEX IF EXISTS idx_fields_section_required;
DROP INDEX IF EXISTS idx_field_values_session_field_value;
DROP INDEX IF EXISTS idx_sessions_company_updated;
DROP INDEX IF EXISTS idx_blueprints_company_updated;
