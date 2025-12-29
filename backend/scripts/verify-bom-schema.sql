-- ============================================================================
-- BOM Schema Verification Script
-- Run this in Supabase SQL Editor to verify your schema is correct
-- ============================================================================

-- Check if make_buy and unit_cost columns exist
SELECT
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bom_items'
AND column_name IN ('make_buy', 'unit_cost', 'parent_item_id')
ORDER BY column_name;

-- If the above returns 0 rows for make_buy or unit_cost, run migration 007:
-- Copy and paste from: backend/migrations/007_add_cost_fields_to_bom_items.sql

-- Verify indexes exist
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'bom_items'
AND indexname IN ('idx_bom_items_make_buy', 'idx_bom_items_unit_cost', 'idx_bom_items_parent_item_id')
ORDER BY indexname;

-- Check sample data to see hierarchy
SELECT
    id,
    name,
    item_type,
    parent_item_id,
    make_buy,
    unit_cost,
    sort_order
FROM bom_items
ORDER BY sort_order
LIMIT 20;

-- Count items by type
SELECT
    item_type,
    COUNT(*) as count
FROM bom_items
GROUP BY item_type
ORDER BY item_type;

-- Verify hierarchy (check parent-child relationships using recursive CTE)
-- This validates the actual tree structure by traversing parent_item_id relationships
-- Replace 'YOUR_BOM_ID_HERE' with the actual BOM ID you want to verify
WITH RECURSIVE hierarchy_tree AS (
  -- Base case: root items (no parent)
  SELECT
    id,
    name,
    item_type,
    parent_item_id,
    bom_id,
    0 as level,
    CAST(name AS TEXT) as path
  FROM bom_items
  WHERE bom_id = 'YOUR_BOM_ID_HERE'
    AND parent_item_id IS NULL

  UNION ALL

  -- Recursive case: children
  SELECT
    bi.id,
    bi.name,
    bi.item_type,
    bi.parent_item_id,
    bi.bom_id,
    ht.level + 1,
    ht.path || ' -> ' || bi.name
  FROM bom_items bi
  INNER JOIN hierarchy_tree ht ON bi.parent_item_id = ht.id
  WHERE bi.bom_id = 'YOUR_BOM_ID_HERE'
)
SELECT
  REPEAT('  ', level) || name as hierarchy,
  level,
  item_type,
  parent_item_id,
  bom_id,
  path
FROM hierarchy_tree
ORDER BY path
LIMIT 50;

-- Detect orphaned items (items with parent_item_id that doesn't exist)
-- Replace 'YOUR_BOM_ID_HERE' with the actual BOM ID you want to verify
SELECT
  bi.id,
  bi.name,
  bi.item_type,
  bi.parent_item_id,
  bi.bom_id,
  'Orphaned: parent does not exist' as issue
FROM bom_items bi
WHERE bi.bom_id = 'YOUR_BOM_ID_HERE'
  AND bi.parent_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bom_items parent
    WHERE parent.id = bi.parent_item_id
  )
LIMIT 10;
