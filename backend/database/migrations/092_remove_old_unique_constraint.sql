-- Migration 092: Remove the old unique constraint that prevents multiple vendors per BOM item

-- Drop the old unique constraint
ALTER TABLE lot_vendor_assignments 
DROP CONSTRAINT IF EXISTS unique_lot_vendor_assignment;

-- Verify only the correct constraint remains
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conkey as column_numbers
FROM pg_constraint 
WHERE conrelid = 'lot_vendor_assignments'::regclass 
AND contype = 'u';