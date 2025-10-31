-- Migration 009 Down: Remove key column from sections

-- Remove unique constraint
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_blueprint_key_unique;

-- Remove key column
ALTER TABLE sections DROP COLUMN IF EXISTS key;
