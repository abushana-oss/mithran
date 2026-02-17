-- Migration: Add process column to vendor_equipment table
-- Purpose: Store process information for equipment (e.g., 'Milling', 'Turning', etc.)
-- Date: 2025-12-30

-- Add process column to vendor_equipment table
ALTER TABLE vendor_equipment
ADD COLUMN IF NOT EXISTS process TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_equipment_process ON vendor_equipment(process);

-- Add comment to explain the column
COMMENT ON COLUMN vendor_equipment.process IS 'Manufacturing process for the equipment (e.g., Milling, Turning, Grinding)';
