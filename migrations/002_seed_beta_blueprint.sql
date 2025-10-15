-- ============================================================================
-- Centercode Alchemy - Seed Beta Test Plan Blueprint
-- Migration: 002_seed_beta_blueprint.sql
-- ============================================================================
-- Inserts a complete Beta Test Plan blueprint with 4 sections, 11 fields,
-- and 3 artifact generators as a starter template for users

-- ============================================================================
-- 1. INSERT DEMO COMPANY
-- ============================================================================
-- This is a demo company that will own the Beta Test Plan blueprint
INSERT INTO companies (id, name, branding) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Centercode Demo', '{"theme": "default"}');

-- ============================================================================
-- 2. INSERT DEMO MEMBER (OWNER)
-- ============================================================================
-- This is a placeholder member for seeding; will be replaced by real auth later
INSERT INTO members (id, company_id, auth_id, role, name, email) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'seed-user-001', 'owner', 'Demo Owner', 'demo@centercode.com');

-- ============================================================================
-- 3. INSERT BETA TEST PLAN BLUEPRINT
-- ============================================================================
INSERT INTO blueprints (id, company_id, name, version, status, description) VALUES
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Beta Test Plan', 1, 'published', 'Comprehensive template for planning a beta test program with objectives, participants, product details, and schedule');

-- ============================================================================
-- 4. INSERT SECTIONS
-- ============================================================================
-- Section 1: Project Overview
INSERT INTO sections (id, blueprint_id, order_index, title, description) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 0, 'Project Overview', 'High level context for the beta.');

-- Section 2: Participants
INSERT INTO sections (id, blueprint_id, order_index, title, description) VALUES
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000003', 1, 'Participants', 'Who will participate and how many.');

-- Section 3: Product Details
INSERT INTO sections (id, blueprint_id, order_index, title, description) VALUES
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000003', 2, 'Product Details', 'What is being tested.');

-- Section 4: Schedule
INSERT INTO sections (id, blueprint_id, order_index, title, description) VALUES
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000003', 3, 'Schedule', 'Timeline for the beta.');

-- ============================================================================
-- 5. INSERT FIELDS
-- ============================================================================
-- Section 1: Project Overview (4 fields)
INSERT INTO fields (section_id, key, type, label, help_text, placeholder, required, span, order_index) VALUES
  ('00000000-0000-0000-0000-000000000101', 'project_name', 'ShortText', 'Project name', 'Working title or code name', NULL, true, 1, 0),
  ('00000000-0000-0000-0000-000000000101', 'objective', 'LongText', 'Primary objectives', 'What this beta must prove', NULL, true, 2, 1),
  ('00000000-0000-0000-0000-000000000101', 'success_criteria', 'LongText', 'Success criteria', 'Measurable outcomes', NULL, true, 2, 2),
  ('00000000-0000-0000-0000-000000000101', 'is_public_beta', 'Toggle', 'Public beta', 'Public vs private', NULL, false, 1, 3);

-- Section 2: Participants (3 fields)
INSERT INTO fields (section_id, key, type, label, help_text, placeholder, required, span, order_index) VALUES
  ('00000000-0000-0000-0000-000000000102', 'target_profile', 'LongText', 'Target profile', 'Persona, segments, devices', NULL, true, 2, 0),
  ('00000000-0000-0000-0000-000000000102', 'recruitment_channels', 'LongText', 'Recruitment channels', 'Email, panel, social', NULL, false, 2, 1),
  ('00000000-0000-0000-0000-000000000102', 'participant_count', 'ShortText', 'Participant count', 'Number or range', NULL, true, 1, 2);

-- Section 3: Product Details (3 fields)
INSERT INTO fields (section_id, key, type, label, help_text, placeholder, required, span, order_index) VALUES
  ('00000000-0000-0000-0000-000000000103', 'product_description', 'LongText', 'Product description', 'What it does and for whom', NULL, true, 2, 0),
  ('00000000-0000-0000-0000-000000000103', 'key_features', 'LongText', 'Key features', 'Bulleted list in Markdown', NULL, false, 2, 1),
  ('00000000-0000-0000-0000-000000000103', 'price', 'ShortText', 'Price', 'List price or range', NULL, false, 1, 2);

-- Section 4: Schedule (3 fields)
INSERT INTO fields (section_id, key, type, label, help_text, placeholder, required, span, order_index) VALUES
  ('00000000-0000-0000-0000-000000000104', 'start_date', 'ShortText', 'Start date', 'YYYY-MM-DD', NULL, true, 1, 0),
  ('00000000-0000-0000-0000-000000000104', 'end_date', 'ShortText', 'End date', 'YYYY-MM-DD', NULL, true, 1, 1),
  ('00000000-0000-0000-0000-000000000104', 'milestones', 'LongText', 'Key milestones', 'Bulleted list', NULL, false, 2, 2);

-- ============================================================================
-- 6. INSERT ARTIFACT GENERATORS
-- ============================================================================
-- Generator 1: Test Plan
INSERT INTO blueprint_artifact_generators (blueprint_id, name, description, prompt_template, output_format, visible_in_data_room, order_index) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Test Plan', 'Comprehensive beta test plan', 'You are a senior beta program manager. Using the Session data and Section Notes, produce a clear test plan with these sections: Objectives, Scope, Participants, Environments, Schedule, Success Criteria, Risks, Communications, Reporting Cadence. Use concise headings and bullets. Where a field is missing, insert a short bracketed placeholder. Do not invent dates or metrics.

Session fields:
{{fields_json}}

Section notes:
{{notes_json}}', 'Markdown', true, 0);

-- Generator 2: Recruitment Plan
INSERT INTO blueprint_artifact_generators (blueprint_id, name, description, prompt_template, output_format, visible_in_data_room, order_index) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Recruitment Plan', 'Target profile and channels', 'Create a recruitment plan using target_profile, participant_count, and recruitment_channels. Include sourcing tactics, screening summary, and timeline aligned to start_date.

Session fields:
{{fields_json}}

Section notes:
{{notes_json}}', 'Markdown', true, 1);

-- Generator 3: Executive Quote
INSERT INTO blueprint_artifact_generators (blueprint_id, name, description, prompt_template, output_format, visible_in_data_room, order_index) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Executive Quote', 'Short summary for leadership', 'Write a 120 word executive summary of the beta goals and timing. One paragraph, crisp tone.

Session fields:
{{fields_json}}

Section notes:
{{notes_json}}', 'Markdown', true, 2);

-- ============================================================================
-- END OF MIGRATION 002
-- ============================================================================
