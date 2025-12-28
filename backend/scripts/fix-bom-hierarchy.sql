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
-- Example: If you have these items that need to be organized:
-- 1. Engine Block (Assembly) - root
-- 2. Cylinder Head (Sub-Assembly) - child of Engine Block
-- 3. Piston (Child Part) - child of Cylinder Head
-- 4. Casting (BOP) - child of Piston

-- Replace the IDs below with your actual item IDs

-- Set Sub-Assembly parent to Assembly
UPDATE bom_items
SET parent_item_id = (
    SELECT id FROM bom_items
    WHERE item_type = 'assembly'
    AND bom_id = 'YOUR_BOM_ID_HERE'
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE item_type = 'sub_assembly'
AND parent_item_id IS NULL
AND bom_id = 'YOUR_BOM_ID_HERE';

-- Set Child Part parent to Sub-Assembly
UPDATE bom_items
SET parent_item_id = (
    SELECT id FROM bom_items
    WHERE item_type = 'sub_assembly'
    AND bom_id = 'YOUR_BOM_ID_HERE'
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE item_type = 'child_part'
AND parent_item_id IS NULL
AND bom_id = 'YOUR_BOM_ID_HERE';

-- Set BOP parent to Child Part
UPDATE bom_items
SET parent_item_id = (
    SELECT id FROM bom_items
    WHERE item_type = 'child_part'
    AND bom_id = 'YOUR_BOM_ID_HERE'
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE item_type = 'bop'
AND parent_item_id IS NULL
AND bom_id = 'YOUR_BOM_ID_HERE';

-- Step 4: Verify the fixed hierarchy
SELECT
    CASE
        WHEN item_type = 'assembly' THEN '📦 ' || name
        WHEN item_type = 'sub_assembly' THEN '  ├─ 📦 ' || name
        WHEN item_type = 'child_part' THEN '    ├─ 📄 ' || name
        WHEN item_type = 'bop' THEN '      └─ ⬛ ' || name
    END as hierarchy,
    id,
    item_type,
    parent_item_id
FROM bom_items
WHERE bom_id = 'YOUR_BOM_ID_HERE'
ORDER BY sort_order;
