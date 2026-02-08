-- Migration 085: Clean up orphaned data before applying foreign key constraints

-- 1. First, identify and remove orphaned production_processes records
DELETE FROM production_processes 
WHERE production_lot_id NOT IN (SELECT id FROM production_lots);

-- 2. Identify and remove orphaned lot_vendor_assignments records
DELETE FROM lot_vendor_assignments 
WHERE production_lot_id NOT IN (SELECT id FROM production_lots);

-- 3. Show what we cleaned up
SELECT 
    'production_processes' as table_name,
    COUNT(*) as remaining_records
FROM production_processes
UNION ALL
SELECT 
    'lot_vendor_assignments' as table_name,
    COUNT(*) as remaining_records
FROM lot_vendor_assignments
UNION ALL
SELECT 
    'production_lots' as table_name,
    COUNT(*) as remaining_records
FROM production_lots;

-- 4. Now ensure the expected_delivery_date column exists in lot_vendor_assignments
DO $$
BEGIN
    -- Add expected_delivery_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lot_vendor_assignments' 
        AND column_name = 'expected_delivery_date'
    ) THEN
        ALTER TABLE lot_vendor_assignments 
        ADD COLUMN expected_delivery_date DATE;
        
        RAISE NOTICE 'Added expected_delivery_date column to lot_vendor_assignments table';
    ELSE
        RAISE NOTICE 'expected_delivery_date column already exists in lot_vendor_assignments table';
    END IF;
    
    -- Add actual_delivery_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lot_vendor_assignments' 
        AND column_name = 'actual_delivery_date'
    ) THEN
        ALTER TABLE lot_vendor_assignments 
        ADD COLUMN actual_delivery_date DATE;
        
        RAISE NOTICE 'Added actual_delivery_date column to lot_vendor_assignments table';
    ELSE
        RAISE NOTICE 'actual_delivery_date column already exists in lot_vendor_assignments table';
    END IF;
END $$;

-- 5. Verify the columns exist
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lot_vendor_assignments' 
AND column_name IN ('expected_delivery_date', 'actual_delivery_date')
ORDER BY table_name, column_name;