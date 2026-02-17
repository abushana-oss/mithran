-- ============================================================================
-- Migration: Add Make/Buy Field and Unit Cost to BOM Items
-- Description: Add make_buy field and unit_cost for purchasing decisions
-- ============================================================================

-- Add make_buy column to bom_items table
ALTER TABLE bom_items
ADD COLUMN make_buy VARCHAR(10) DEFAULT 'make' CHECK (make_buy IN ('make', 'buy')),
ADD COLUMN unit_cost DECIMAL(15, 2) DEFAULT 0 CHECK (unit_cost >= 0);

-- Add indexes for make/buy queries
CREATE INDEX idx_bom_items_make_buy ON bom_items(make_buy);
CREATE INDEX idx_bom_items_unit_cost ON bom_items(unit_cost) WHERE unit_cost > 0;

-- Comments
COMMENT ON COLUMN bom_items.make_buy IS 'Make or buy decision: make (manufacturing) or buy (purchasing)';
COMMENT ON COLUMN bom_items.unit_cost IS 'Unit cost in INR for purchased parts (when make_buy is buy)';
