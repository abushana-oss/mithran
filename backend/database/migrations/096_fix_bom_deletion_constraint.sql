-- Migration 096: Fix BOM deletion constraint to allow cascading deletes
-- This fixes the foreign key constraint error when deleting projects/BOMs

-- Drop the existing foreign key constraint that uses RESTRICT
ALTER TABLE production_lots 
DROP CONSTRAINT IF EXISTS production_lots_bom_id_fkey;

-- Recreate the constraint with CASCADE to allow BOM deletion
ALTER TABLE production_lots 
ADD CONSTRAINT production_lots_bom_id_fkey 
FOREIGN KEY (bom_id) 
REFERENCES boms(id) 
ON DELETE CASCADE;

-- Also ensure any lot_vendor_assignments are cleaned up
-- First check if the table and constraint exist
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lot_vendor_assignments_production_lot_id_fkey' 
        AND table_name = 'lot_vendor_assignments'
    ) THEN
        ALTER TABLE lot_vendor_assignments 
        DROP CONSTRAINT lot_vendor_assignments_production_lot_id_fkey;
        
        -- Recreate with CASCADE
        ALTER TABLE lot_vendor_assignments 
        ADD CONSTRAINT lot_vendor_assignments_production_lot_id_fkey 
        FOREIGN KEY (production_lot_id) 
        REFERENCES production_lots(id) 
        ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if table doesn't exist
        NULL;
END $$;

-- Clean up any orphaned production lots that might exist
DELETE FROM production_lots 
WHERE bom_id NOT IN (SELECT id FROM boms);

-- Add comment for documentation
COMMENT ON CONSTRAINT production_lots_bom_id_fkey ON production_lots 
IS 'Foreign key to boms table with CASCADE delete to allow BOM deletion';