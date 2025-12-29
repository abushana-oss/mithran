-- ============================================================================
-- Migration: Add Unit Cost Constraint
-- Description: Enforce that unit_cost can only be non-zero when make_buy='buy'
-- ============================================================================

-- Add CHECK constraint to enforce business rule:
-- unit_cost should only be set for purchased parts (make_buy='buy')
ALTER TABLE bom_items
ADD CONSTRAINT chk_unit_cost_buy CHECK (make_buy = 'buy' OR unit_cost = 0);

-- Update comment to reflect the enforced constraint
COMMENT ON CONSTRAINT chk_unit_cost_buy ON bom_items IS
  'Enforces that unit_cost can only be non-zero when make_buy is set to buy. Manufactured parts (make_buy=make) must have unit_cost=0.';
