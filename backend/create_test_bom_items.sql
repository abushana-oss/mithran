-- Create test BOM items for the selected BOM ID: 8abc1578-35c5-460a-901a-e8c8aeefc127
-- This will help test if the API is working correctly

-- First check if the BOM exists
SELECT id, name, project_id FROM boms WHERE id = '8abc1578-35c5-460a-901a-e8c8aeefc127';

-- Check if there are any existing BOM items for this BOM
SELECT id, name, bom_id FROM bom_items WHERE bom_id = '8abc1578-35c5-460a-901a-e8c8aeefc127';

-- If the BOM exists but has no items, let's create some test items
-- Note: Replace 'user-uuid-here' with an actual user UUID from your database

-- Get a user ID to use
SELECT id FROM auth.users LIMIT 1;

-- Insert test BOM items (adjust user_id as needed)
-- Note: unit_cost must be 0 for make_buy='make' items due to chk_unit_cost_buy constraint
INSERT INTO bom_items (
    bom_id,
    name,
    part_number,
    description,
    item_type,
    quantity,
    annual_volume,
    unit_cost,
    material,
    make_buy,
    sort_order,
    user_id
) VALUES 
(
    '8abc1578-35c5-460a-901a-e8c8aeefc127',
    'Main Housing',
    'MH-001',
    'Main aluminum housing for the assembly',
    'child_part',
    1,
    1000,
    0.00,  -- unit_cost must be 0 for make items
    'Aluminum 6061',
    'make',
    1,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    '8abc1578-35c5-460a-901a-e8c8aeefc127',
    'Mounting Bracket',
    'MB-002', 
    'Steel mounting bracket with powder coating',
    'child_part',
    2,
    2000,
    850.50,  -- unit_cost can be non-zero for buy items
    'Steel A36',
    'buy',
    2,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    '8abc1578-35c5-460a-901a-e8c8aeefc127',
    'PCB Board',
    'PCB-003',
    'Main control circuit board',
    'child_part',
    1,
    1000,
    1200.25,  -- unit_cost can be non-zero for buy items
    'FR4 PCB',
    'buy',
    3,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    '8abc1578-35c5-460a-901a-e8c8aeefc127',
    'Assembly Unit',
    'AU-004',
    'Complete assembly unit with all sub-components',
    'assembly',
    1,
    1000,
    0.00,  -- unit_cost must be 0 for make items
    'Mixed',
    'make',
    4,
    (SELECT id FROM auth.users LIMIT 1)
);

-- Verify the insert
SELECT 
    id,
    name,
    part_number,
    description,
    item_type,
    quantity,
    unit_cost,
    material,
    make_buy
FROM bom_items 
WHERE bom_id = '8abc1578-35c5-460a-901a-e8c8aeefc127'
ORDER BY sort_order;

-- Check total cost calculation
SELECT 
    b.id as bom_id,
    b.name as bom_name,
    b.total_cost as stored_total_cost,
    SUM(bi.quantity * COALESCE(bi.unit_cost, 0)) as calculated_total_cost
FROM boms b
LEFT JOIN bom_items bi ON b.id = bi.bom_id
WHERE b.id = '8abc1578-35c5-460a-901a-e8c8aeefc127'
GROUP BY b.id, b.name, b.total_cost;