-- Migration 091: Allow multiple vendors per BOM item
-- Drop the existing unique constraint and create a new one that allows multiple vendors per BOM item

-- Drop the existing unique constraint
ALTER TABLE lot_vendor_assignments 
DROP CONSTRAINT IF EXISTS lot_vendor_assignments_production_lot_id_bom_item_id_key;

-- Create a new unique constraint that includes vendor_id
-- This allows multiple vendors for the same BOM item, but prevents duplicate assignments of the same vendor to the same BOM item
ALTER TABLE lot_vendor_assignments 
ADD CONSTRAINT lot_vendor_assignments_production_lot_id_bom_item_id_vendor_id_key 
UNIQUE (production_lot_id, bom_item_id, vendor_id);

-- Verify the constraint was created
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conkey as column_numbers
FROM pg_constraint 
WHERE conrelid = 'lot_vendor_assignments'::regclass 
AND contype = 'u';