-- ============================================================================
-- Centercode Alchemy - Performance Optimization Indexes
-- Migration: 007_performance_indexes.sql
-- ============================================================================
-- Adds composite indexes to optimize common query patterns for blueprints
-- and sessions list pages.
--
-- Related Code Changes:
-- - src/app/api/v1/blueprints/route.ts: Optimized GET query to use JOINs
-- - src/app/api/v1/sessions/route.ts: Optimized GET query to use JOINs
-- - Both pages now use 30-second revalidation instead of no-store
-- ============================================================================

-- ============================================================================
-- 1. FIELDS - Composite index for filtering required fields
-- ============================================================================
-- Helps with: Counting required vs. total fields in sessions query
CREATE INDEX IF NOT EXISTS idx_fields_section_required
ON fields(section_id, required)
WHERE required = true;

-- ============================================================================
-- 2. SESSION_FIELD_VALUES - Composite index for JOIN optimization
-- ============================================================================
-- Helps with: Joining session values to fields efficiently
-- This is a covering index that includes the value column
CREATE INDEX IF NOT EXISTS idx_field_values_session_field_value
ON session_field_values(session_id, field_id)
INCLUDE (value);

-- ============================================================================
-- 3. SESSIONS - Index for ordering by updated_at
-- ============================================================================
-- Helps with: Fast sorting of sessions/blueprints lists
CREATE INDEX IF NOT EXISTS idx_sessions_company_updated
ON sessions(company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_blueprints_company_updated
ON blueprints(company_id, updated_at DESC);

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- Query Optimizations Made:
--
-- 1. Blueprints API (GET /api/v1/blueprints):
--    - Changed from correlated subqueries (N+2 queries per request)
--    - To single query with LEFT JOINs and GROUP BY
--    - Expected improvement: ~60-70% faster
--
-- 2. Sessions API (GET /api/v1/sessions):
--    - Changed from 4 correlated subqueries per session (N*4 queries)
--    - To single query with LEFT JOINs, CASE expressions, and GROUP BY
--    - Expected improvement: ~70-80% faster with multiple sessions
--
-- 3. Caching Strategy:
--    - Both pages now use 30-second revalidation
--    - Reduces server load on repeated page visits
--    - First visit still fetches fresh data
--
-- Existing Indexes (already optimal):
-- - All foreign keys are indexed
-- - Company_id columns are indexed on all major tables
-- - These base indexes already support most of our queries
-- ============================================================================
