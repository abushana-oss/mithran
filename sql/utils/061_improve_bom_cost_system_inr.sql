-- ============================================================================
-- Migration: Improve BOM Cost System with INR Currency
-- Description: Enhances BOM cost calculations and ensures proper INR handling
-- Author: Principal Engineer
-- Date: 2026-01-30
-- ============================================================================

-- Ensure bom_items table has proper cost fields with INR precision
ALTER TABLE bom_items 
ALTER COLUMN unit_cost TYPE DECIMAL(20,4),
ADD COLUMN IF NOT EXISTS material_cost_inr DECIMAL(20,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_cost_inr DECIMAL(20,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overhead_cost_inr DECIMAL(20,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost_inr DECIMAL(20,4) DEFAULT 0;

-- Update boms table for INR precision
ALTER TABLE boms
ALTER COLUMN total_cost TYPE DECIMAL(20,4);

-- Add currency column to ensure INR tracking
ALTER TABLE boms
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR' NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bom_items_unit_cost_inr ON bom_items(unit_cost) WHERE unit_cost > 0;
CREATE INDEX IF NOT EXISTS idx_bom_items_total_cost_inr ON bom_items(total_cost_inr) WHERE total_cost_inr > 0;
CREATE INDEX IF NOT EXISTS idx_boms_currency ON boms(currency);
CREATE INDEX IF NOT EXISTS idx_boms_total_cost ON boms(total_cost) WHERE total_cost > 0;

-- Enhanced function to calculate BOM costs in INR
CREATE OR REPLACE FUNCTION calculate_bom_cost_inr(bom_uuid UUID)
RETURNS DECIMAL(20,4) AS $$
DECLARE
    total_cost_result DECIMAL(20,4) := 0;
BEGIN
    -- Calculate total cost from all items in the BOM
    SELECT COALESCE(SUM(
        COALESCE(bi.total_cost_inr, 0) + 
        COALESCE(bi.material_cost_inr, 0) + 
        COALESCE(bi.labor_cost_inr, 0) + 
        COALESCE(bi.overhead_cost_inr, 0) +
        (COALESCE(bi.unit_cost, 0) * COALESCE(bi.quantity, 1))
    ), 0)
    INTO total_cost_result
    FROM bom_items bi
    WHERE bi.bom_id = bom_uuid;
    
    RETURN total_cost_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enhanced trigger function for BOM cost updates
CREATE OR REPLACE FUNCTION update_bom_totals_inr()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the BOM totals when items change
    UPDATE boms
    SET
        total_items = (
            SELECT COUNT(*)
            FROM bom_items
            WHERE bom_id = COALESCE(NEW.bom_id, OLD.bom_id)
        ),
        total_cost = calculate_bom_cost_inr(COALESCE(NEW.bom_id, OLD.bom_id)),
        currency = 'INR',
        updated_at = NOW()
    WHERE id = COALESCE(NEW.bom_id, OLD.bom_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and create enhanced version
DROP TRIGGER IF EXISTS trigger_update_bom_total_items ON bom_items;
DROP TRIGGER IF EXISTS trigger_update_bom_totals_inr ON bom_items;

CREATE TRIGGER trigger_update_bom_totals_inr
    AFTER INSERT OR UPDATE OR DELETE ON bom_items
    FOR EACH ROW
    EXECUTE FUNCTION update_bom_totals_inr();

-- Function to convert legacy USD values to INR (if needed)
CREATE OR REPLACE FUNCTION migrate_usd_to_inr()
RETURNS VOID AS $$
DECLARE
    usd_to_inr_rate DECIMAL(10,4) := 83.0; -- Current approximate rate
BEGIN
    -- Update any existing USD values to INR
    UPDATE boms 
    SET 
        total_cost = total_cost * usd_to_inr_rate,
        currency = 'INR',
        updated_at = NOW()
    WHERE currency != 'INR' OR currency IS NULL;
    
    -- Update BOM items unit costs
    UPDATE bom_items
    SET 
        unit_cost = unit_cost * usd_to_inr_rate,
        total_cost_inr = unit_cost * quantity * usd_to_inr_rate
    WHERE unit_cost > 0;
    
    -- Log the migration
    RAISE NOTICE 'Migrated BOM costs from USD to INR using rate: %', usd_to_inr_rate;
END;
$$ LANGUAGE plpgsql;

-- Enhanced validation function for BOM data integrity
CREATE OR REPLACE FUNCTION validate_bom_data_integrity()
RETURNS TABLE (
    bom_id UUID,
    bom_name TEXT,
    calculated_items INTEGER,
    stored_items INTEGER,
    calculated_cost DECIMAL(20,4),
    stored_cost DECIMAL(20,4),
    integrity_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        (SELECT COUNT(*)::INTEGER FROM bom_items WHERE bom_id = b.id) as calc_items,
        b.total_items,
        calculate_bom_cost_inr(b.id),
        COALESCE(b.total_cost, 0),
        CASE 
            WHEN (SELECT COUNT(*) FROM bom_items WHERE bom_id = b.id) = b.total_items 
                AND ABS(calculate_bom_cost_inr(b.id) - COALESCE(b.total_cost, 0)) < 0.01 
            THEN 'VALID'
            ELSE 'INCONSISTENT'
        END as status
    FROM boms b
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON COLUMN boms.currency IS 'Currency code (INR for Indian Rupees)';
COMMENT ON COLUMN bom_items.material_cost_inr IS 'Material cost in INR';
COMMENT ON COLUMN bom_items.labor_cost_inr IS 'Labor cost in INR';
COMMENT ON COLUMN bom_items.overhead_cost_inr IS 'Overhead cost in INR';
COMMENT ON COLUMN bom_items.total_cost_inr IS 'Total cost per item in INR';

COMMENT ON FUNCTION calculate_bom_cost_inr(UUID) IS 'Calculates total BOM cost in INR from all items';
COMMENT ON FUNCTION update_bom_totals_inr() IS 'Trigger function to auto-update BOM totals when items change';
COMMENT ON FUNCTION validate_bom_data_integrity() IS 'Validates BOM data consistency for auditing purposes';

-- Run the migration to convert existing data
SELECT migrate_usd_to_inr();

-- Refresh all BOM totals to ensure consistency
UPDATE boms SET updated_at = NOW() WHERE id IS NOT NULL;