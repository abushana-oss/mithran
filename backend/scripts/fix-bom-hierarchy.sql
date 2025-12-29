-- ============================================================================
-- Fix BOM Hierarchy Script
-- This script organizes your BOM items into proper parent-child relationships
-- ============================================================================

-- Step 1: Check current hierarchy state
SELECT
    id,
    name,
    item_type,
    parent_item_id,
    sort_order
FROM bom_items
WHERE bom_id = 'YOUR_BOM_ID_HERE'  -- Replace with your actual BOM ID
ORDER BY sort_order;

-- Step 2: Clear all parent relationships (BACKUP YOUR DATA FIRST!)
-- Uncomment the line below to clear all parent IDs
-- UPDATE bom_items SET parent_item_id = NULL WHERE bom_id = 'YOUR_BOM_ID_HERE';

-- Step 3: Organize items properly
-- ⚠️  WARNING: The generic updates below assign ALL items to a SINGLE parent,
-- which is only suitable if you have exactly one item at each level.
-- For complex hierarchies with multiple items, use specific ID assignments below.

-- ============================================================================
-- OPTION A: Generic assignment (only use if you have one item per level)
-- ============================================================================

-- Uncomment if you want all sub-assemblies assigned to the first assembly:
-- UPDATE bom_items
-- SET parent_item_id = (
--     SELECT id FROM bom_items
--     WHERE item_type = 'assembly'
--     AND bom_id = 'YOUR_BOM_ID_HERE'
--     ORDER BY created_at ASC
--     LIMIT 1
-- )
-- WHERE item_type = 'sub_assembly'
-- AND parent_item_id IS NULL
-- AND bom_id = 'YOUR_BOM_ID_HERE';

-- ============================================================================
-- OPTION B: Specific ID assignment (recommended for proper hierarchy)
-- ============================================================================

-- Example: Assign specific items to specific parents
-- Replace these UUIDs with your actual item IDs from Step 1

-- Assign Sub-Assembly to specific Assembly
-- UPDATE bom_items
-- SET parent_item_id = 'assembly-id-here'
-- WHERE id = 'sub-assembly-id-here';

-- Assign Child Parts to specific Sub-Assemblies
-- UPDATE bom_items
-- SET parent_item_id = 'sub-assembly-id-here'
-- WHERE id = 'child-part-id-here';

-- Assign BOPs to specific Child Parts
-- UPDATE bom_items
-- SET parent_item_id = 'child-part-id-here'
-- WHERE id = 'bop-id-here';

-- ============================================================================
-- OPTION C: Distribute items evenly (if you have multiple parents)
-- ============================================================================

-- Example: Distribute child_parts among multiple sub_assemblies
-- This uses ROW_NUMBER to distribute items evenly
/*
WITH numbered_parents AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as parent_num
  FROM bom_items
  WHERE item_type = 'sub_assembly' AND bom_id = 'YOUR_BOM_ID_HERE'
),
numbered_children AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as child_num
  FROM bom_items
  WHERE item_type = 'child_part' AND parent_item_id IS NULL AND bom_id = 'YOUR_BOM_ID_HERE'
)
UPDATE bom_items bi
SET parent_item_id = (
  SELECT np.id
  FROM numbered_parents np
  WHERE np.parent_num = (
    SELECT MOD(nc.child_num - 1, (SELECT COUNT(*) FROM numbered_parents)) + 1
    FROM numbered_children nc
    WHERE nc.id = bi.id
  )
)
WHERE bi.id IN (SELECT id FROM numbered_children);
*/

-- Step 4: Verify the fixed hierarchy
-- This validates the actual tree structure by traversing parent_item_id relationships
-- Replace 'YOUR_BOM_ID_HERE' with the actual BOM ID
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
  path
FROM hierarchy_tree
ORDER BY path;

-- Step 5: Detect any orphaned items (items with broken parent references)
SELECT
  bi.id,
  bi.name,
  bi.item_type,
  bi.parent_item_id,
  'Orphaned: parent does not exist' as issue
FROM bom_items bi
WHERE bi.bom_id = 'YOUR_BOM_ID_HERE'
  AND bi.parent_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bom_items parent
    WHERE parent.id = bi.parent_item_id
  );
