-- ============================================================================
-- Migration: Add Dimensions and Weight to BOM Items
-- Description: Add physical properties for process planning and calculations
-- ============================================================================

-- Add columns for physical dimensions and weight
ALTER TABLE bom_items
ADD COLUMN weight DECIMAL(15, 4),
ADD COLUMN max_length DECIMAL(15, 4),
ADD COLUMN max_width DECIMAL(15, 4),
ADD COLUMN max_height DECIMAL(15, 4),
ADD COLUMN surface_area DECIMAL(15, 4);

-- Add comments
COMMENT ON COLUMN bom_items.weight IS 'Part weight in kg';
COMMENT ON COLUMN bom_items.max_length IS 'Maximum length in mm';
COMMENT ON COLUMN bom_items.max_width IS 'Maximum width in mm';
COMMENT ON COLUMN bom_items.max_height IS 'Maximum height in mm';
COMMENT ON COLUMN bom_items.surface_area IS 'Surface area in mm2';

