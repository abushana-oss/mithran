-- Migration 084: Add expected_delivery_date column to lot_vendor_assignments if missing
-- This ensures the column exists even if previous migration 072 wasn't applied correctly

-- Check if the column exists and add it if it doesn't
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

-- Verify the columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'lot_vendor_assignments' 
AND column_name IN ('expected_delivery_date', 'actual_delivery_date')
ORDER BY column_name;