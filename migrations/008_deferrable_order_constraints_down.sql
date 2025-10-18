-- Rollback: Remove deferrable constraints and restore immediate constraints

-- Drop deferrable constraints
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_blueprint_id_order_index_key;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_section_id_order_index_key;

-- Recreate as immediate constraints (original behavior)
ALTER TABLE sections ADD CONSTRAINT sections_blueprint_id_order_index_key
  UNIQUE (blueprint_id, order_index);

ALTER TABLE fields ADD CONSTRAINT fields_section_id_order_index_key
  UNIQUE (section_id, order_index);
