# Drag-Drop Ordering Fix Summary

## Problem

Section and field drag-drop reordering was failing with constraint violation errors:

- `duplicate key value violates unique constraint "fields_section_id_order_index_key"`
- `duplicate key value violates unique constraint "sections_blueprint_id_order_index_key"`

## Root Cause

The database had UNIQUE constraints on:

- `sections(blueprint_id, order_index)`
- `fields(section_id, order_index)`

When reordering items within a transaction (e.g., swapping positions):

1. Item A at position 0
2. Item B at position 1
3. Update A to position 1 → **CONFLICT** (B is still at position 1)

The constraints were being checked **immediately** after each UPDATE statement, causing failures during reordering.

## Solution

Made the constraints **DEFERRABLE INITIALLY DEFERRED** via migration `008_deferrable_order_constraints.sql`:

```sql
ALTER TABLE sections ADD CONSTRAINT sections_blueprint_id_order_index_key
  UNIQUE (blueprint_id, order_index) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE fields ADD CONSTRAINT fields_section_id_order_index_key
  UNIQUE (section_id, order_index) DEFERRABLE INITIALLY DEFERRED;
```

This delays constraint checking until the **end of the transaction**, allowing intermediate conflicts during reordering.

## Verification

✅ Constraints are now deferrable and initially deferred
✅ Reordering transactions will succeed without intermediate constraint violations
✅ The drag-drop feature should now work correctly for both sections and fields

## Files Changed

- `migrations/008_deferrable_order_constraints.sql` (new)
- `migrations/008_deferrable_order_constraints_down.sql` (new, for rollback)

## How to Test

1. Navigate to any blueprint edit page
2. Drag sections to reorder them
3. Select a section and drag fields to reorder them
4. Verify no errors appear in the console or logs
