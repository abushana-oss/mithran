-- ============================================================================
-- Migration: Remove 'bop' Item Type
-- Description: Removes deprecated 'bop' item type from schema
-- Breaking Change: Ensures frontend/backend schema consistency
--
-- Context:
-- - Frontend TypeScript types only allow: assembly, sub_assembly, child_part
-- - Backend DTO enum only allows: assembly, sub_assembly, child_part
-- - Database schema still had 'bop' in CHECK constraint (inconsistency)
-- ============================================================================

-- ============================================================================
-- 1. VERIFY NO 'BOP' ITEMS EXIST
-- ============================================================================

DO $$
DECLARE
  bop_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bop_count
  FROM bom_items
  WHERE item_type = 'bop';

  IF bop_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove bop item type: % bop items still exist in database. Please migrate them to a valid item type first.', bop_count;
  END IF;

  RAISE NOTICE 'Verification passed: No bop items found in database';
END $$;

-- ============================================================================
-- 2. UPDATE CHECK CONSTRAINT
-- ============================================================================

-- Drop the old constraint
ALTER TABLE bom_items
DROP CONSTRAINT IF EXISTS bom_items_item_type_check;

-- Add new constraint without 'bop'
ALTER TABLE bom_items
ADD CONSTRAINT bom_items_item_type_check
CHECK (item_type IN ('assembly', 'sub_assembly', 'child_part'));

-- ============================================================================
-- 3. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT bom_items_item_type_check ON bom_items IS
'Valid item types: assembly (top-level), sub_assembly (mid-level), child_part (leaf-level). Deprecated: bop removed in migration 009.';

-- ============================================================================
-- 4. VERIFY CONSTRAINT UPDATE
-- ============================================================================

-- This query will show the new constraint
-- SELECT conname, consrc FROM pg_constraint WHERE conname = 'bom_items_item_type_check';

-- Test that 'bop' is now rejected (should fail):
-- INSERT INTO bom_items (bom_id, name, item_type, quantity, annual_volume, user_id)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'bop', 1, 1000, '00000000-0000-0000-0000-000000000000');
-- Expected: ERROR: new row for relation "bom_items" violates check constraint "bom_items_item_type_check"
