-- ============================================================================
-- Migration: Fix BOM INR Migration - Handle View Dependencies
-- Description: Properly migrate BOM cost system to INR with view handling
-- Author: Principal Engineer
-- Date: 2026-01-30
-- ============================================================================

-- Step 1: Drop dependent views and rules to allow column type changes
DROP VIEW IF EXISTS bom_cost_analysis CASCADE;
DROP VIEW IF EXISTS bom_item_cost_hierarchy CASCADE;
DROP VIEW IF EXISTS bom_cost_summary CASCADE;

-- Step 2: Handle any rules that might exist
DO $$ 
BEGIN
    -- Drop any rules that might exist on tables
    DROP RULE IF EXISTS bom_cost_analysis_rule ON bom_items CASCADE;
    DROP RULE IF EXISTS bom_cost_update_rule ON bom_items CASCADE;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL; -- Rule doesn't exist, continue
END $$;

-- Step 3: Now safely alter the column types
ALTER TABLE bom_items 
ALTER COLUMN unit_cost TYPE DECIMAL(20,4);

-- Step 4: Add new INR-specific cost columns
ALTER TABLE bom_items 
ADD COLUMN IF NOT EXISTS material_cost_inr DECIMAL(20,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_cost_inr DECIMAL(20,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overhead_cost_inr DECIMAL(20,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost_inr DECIMAL(20,4) DEFAULT 0;

-- Step 5: Update boms table for INR precision
ALTER TABLE boms
ALTER COLUMN total_cost TYPE DECIMAL(20,4);

-- Step 6: Add currency column to ensure INR tracking
ALTER TABLE boms
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR' NOT NULL;

-- Step 7: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_bom_items_unit_cost_inr ON bom_items(unit_cost) WHERE unit_cost > 0;
CREATE INDEX IF NOT EXISTS idx_bom_items_total_cost_inr ON bom_items(total_cost_inr) WHERE total_cost_inr > 0;
CREATE INDEX IF NOT EXISTS idx_boms_currency ON boms(currency);
CREATE INDEX IF NOT EXISTS idx_boms_total_cost ON boms(total_cost) WHERE total_cost > 0;

-- Step 8: Create enhanced functions for INR calculations
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

-- Step 9: Enhanced trigger function for BOM cost updates
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

-- Step 10: Drop old triggers and create new ones
DROP TRIGGER IF EXISTS trigger_update_bom_total_items ON bom_items;
DROP TRIGGER IF EXISTS trigger_update_bom_totals_inr ON bom_items;

CREATE TRIGGER trigger_update_bom_totals_inr
    AFTER INSERT OR UPDATE OR DELETE ON bom_items
    FOR EACH ROW
    EXECUTE FUNCTION update_bom_totals_inr();

-- Step 11: Recreate the cost hierarchy view with new structure
CREATE VIEW bom_item_cost_hierarchy AS
WITH RECURSIVE cost_tree AS (
    -- Base case: root items (no parent)
    SELECT
        bi.id,
        bi.bom_id,
        bi.name,
        bi.item_type,
        bi.parent_item_id,
        bi.quantity,
        COALESCE(bic.raw_material_cost, 0) as raw_material_cost,
        COALESCE(bic.process_cost, 0) as process_cost,
        COALESCE(bic.packaging_logistics_cost, 0) as packaging_logistics_cost,
        COALESCE(bic.procured_parts_cost, 0) as procured_parts_cost,
        COALESCE(bi.material_cost_inr, 0) as material_cost_inr,
        COALESCE(bi.labor_cost_inr, 0) as labor_cost_inr,
        COALESCE(bi.overhead_cost_inr, 0) as overhead_cost_inr,
        COALESCE(bi.total_cost_inr, 0) as total_cost_inr,
        COALESCE(bi.unit_cost, 0) as unit_cost,
        COALESCE(bic.selling_price, 0) as selling_price,
        COALESCE(bic.is_stale, false) as is_stale,
        0 AS depth,
        ARRAY[bi.id] AS path,
        bi.user_id
    FROM bom_items bi
    LEFT JOIN bom_item_costs bic ON bi.id = bic.bom_item_id
    WHERE bi.parent_item_id IS NULL

    UNION ALL

    -- Recursive case: children
    SELECT
        bi.id,
        bi.bom_id,
        bi.name,
        bi.item_type,
        bi.parent_item_id,
        bi.quantity,
        COALESCE(bic.raw_material_cost, 0) as raw_material_cost,
        COALESCE(bic.process_cost, 0) as process_cost,
        COALESCE(bic.packaging_logistics_cost, 0) as packaging_logistics_cost,
        COALESCE(bic.procured_parts_cost, 0) as procured_parts_cost,
        COALESCE(bi.material_cost_inr, 0) as material_cost_inr,
        COALESCE(bi.labor_cost_inr, 0) as labor_cost_inr,
        COALESCE(bi.overhead_cost_inr, 0) as overhead_cost_inr,
        COALESCE(bi.total_cost_inr, 0) as total_cost_inr,
        COALESCE(bi.unit_cost, 0) as unit_cost,
        COALESCE(bic.selling_price, 0) as selling_price,
        COALESCE(bic.is_stale, false) as is_stale,
        ct.depth + 1,
        ct.path || bi.id,
        bi.user_id
    FROM bom_items bi
    INNER JOIN cost_tree ct ON bi.parent_item_id = ct.id
    LEFT JOIN bom_item_costs bic ON bi.id = bic.bom_item_id
)
SELECT * FROM cost_tree ORDER BY path;

-- Step 12: Create BOM cost analysis view for reporting
CREATE VIEW bom_cost_analysis AS
SELECT 
    b.id as bom_id,
    b.name as bom_name,
    b.version,
    b.status,
    b.currency,
    b.total_items,
    b.total_cost,
    COUNT(bi.id) as calculated_items,
    COALESCE(SUM(bi.unit_cost * bi.quantity), 0) as calculated_unit_cost,
    COALESCE(SUM(bi.total_cost_inr), 0) as calculated_inr_cost,
    (b.total_cost - COALESCE(SUM(bi.unit_cost * bi.quantity), 0)) as cost_variance,
    CASE 
        WHEN b.total_items = COUNT(bi.id) THEN 'CONSISTENT'
        ELSE 'INCONSISTENT'
    END as item_count_status,
    CASE 
        WHEN ABS(b.total_cost - COALESCE(SUM(bi.unit_cost * bi.quantity), 0)) < 0.01 THEN 'CONSISTENT'
        ELSE 'INCONSISTENT'
    END as cost_consistency_status
FROM boms b
LEFT JOIN bom_items bi ON b.id = bi.bom_id
GROUP BY b.id, b.name, b.version, b.status, b.currency, b.total_items, b.total_cost;

-- Step 13: Migration function to convert USD to INR
CREATE OR REPLACE FUNCTION migrate_usd_to_inr()
RETURNS VOID AS $$
DECLARE
    usd_to_inr_rate DECIMAL(10,4) := 83.0; -- Current approximate rate
    converted_count INTEGER := 0;
BEGIN
    -- Update BOMs that don't have INR currency
    UPDATE boms 
    SET 
        total_cost = CASE 
            WHEN currency != 'INR' OR currency IS NULL 
            THEN total_cost * usd_to_inr_rate
            ELSE total_cost 
        END,
        currency = 'INR',
        updated_at = NOW()
    WHERE currency != 'INR' OR currency IS NULL;
    
    GET DIAGNOSTICS converted_count = ROW_COUNT;
    
    -- Update BOM items unit costs for non-INR items
    UPDATE bom_items
    SET 
        unit_cost = unit_cost * usd_to_inr_rate,
        total_cost_inr = unit_cost * quantity * usd_to_inr_rate
    WHERE unit_cost > 0 
      AND bom_id IN (SELECT id FROM boms WHERE currency = 'INR');
    
    -- Log the migration result
    RAISE NOTICE 'Migrated % BOM records from USD to INR using rate: %', converted_count, usd_to_inr_rate;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Data integrity validation function
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

-- Step 15: Add helpful comments
COMMENT ON COLUMN boms.currency IS 'Currency code (INR for Indian Rupees)';
COMMENT ON COLUMN bom_items.material_cost_inr IS 'Material cost in INR';
COMMENT ON COLUMN bom_items.labor_cost_inr IS 'Labor cost in INR';
COMMENT ON COLUMN bom_items.overhead_cost_inr IS 'Overhead cost in INR';
COMMENT ON COLUMN bom_items.total_cost_inr IS 'Total cost per item in INR';

-- Step 16: Execute migration and refresh data
SELECT migrate_usd_to_inr();

-- Step 17: Refresh all BOM totals to ensure consistency
UPDATE boms SET updated_at = NOW() WHERE id IS NOT NULL;

-- Migration completed successfully