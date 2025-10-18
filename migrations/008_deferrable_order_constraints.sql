-- Make order_index unique constraints deferrable to allow reordering within transactions
-- This allows swapping order_index values without constraint violations

-- Drop existing constraints
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_blueprint_id_order_index_key;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_section_id_order_index_key;

-- Recreate as deferrable constraints
ALTER TABLE sections ADD CONSTRAINT sections_blueprint_id_order_index_key
  UNIQUE (blueprint_id, order_index) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE fields ADD CONSTRAINT fields_section_id_order_index_key
  UNIQUE (section_id, order_index) DEFERRABLE INITIALLY DEFERRED;
