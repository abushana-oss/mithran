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

-- Verify hierarchy (check parent-child relationships)
SELECT
    parent.name as parent_name,
    parent.item_type as parent_type,
    child.name as child_name,
    child.item_type as child_type
FROM bom_items parent
LEFT JOIN bom_items child ON child.parent_item_id = parent.id
WHERE parent.item_type = 'assembly'
LIMIT 10;
