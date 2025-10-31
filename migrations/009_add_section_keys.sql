-- Migration 009: Add key column to sections for human-readable token names
-- This allows tokens like {{section:company_background}} instead of {{section:uuid}}

-- Add key column (nullable initially to populate existing rows)
ALTER TABLE sections ADD COLUMN key VARCHAR(255);

-- Create function to generate key from title (same logic as field keys)
CREATE OR REPLACE FUNCTION generate_section_key(title TEXT) RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '_', 'g'),
      '^_|_$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate keys for existing sections
UPDATE sections SET key = generate_section_key(title);

-- Handle duplicate keys by appending a number
WITH duplicates AS (
  SELECT
    id,
    blueprint_id,
    key,
    ROW_NUMBER() OVER (PARTITION BY blueprint_id, key ORDER BY order_index) as rn
  FROM sections
  WHERE key IN (
    SELECT key
    FROM sections
    GROUP BY blueprint_id, key
    HAVING COUNT(*) > 1
  )
)
UPDATE sections s
SET key = CONCAT(d.key, '_', d.rn)
FROM duplicates d
WHERE s.id = d.id AND d.rn > 1;

-- Now make key NOT NULL and add unique constraint
ALTER TABLE sections ALTER COLUMN key SET NOT NULL;
ALTER TABLE sections ADD CONSTRAINT sections_blueprint_key_unique UNIQUE (blueprint_id, key);

-- Clean up the helper function
DROP FUNCTION generate_section_key(TEXT);

-- Add comment for documentation
COMMENT ON COLUMN sections.key IS 'Human-readable key for token references (e.g., "company_background")';
