-- ============================================================================
-- MIGRATION 080: Clean Production Planning Setup
-- ============================================================================
-- This migration ensures clean production planning system without test data

-- Ensure production planning tables exist with correct structure
-- (Most should already exist from previous migrations)

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_lots_status_priority ON production_lots(status, priority);
CREATE INDEX IF NOT EXISTS idx_production_lots_dates_range ON production_lots(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_production_processes_status_dates ON production_processes(status, planned_start_date);
CREATE INDEX IF NOT EXISTS idx_lot_vendor_assignments_status ON lot_vendor_assignments(delivery_status);
CREATE INDEX IF NOT EXISTS idx_process_subtasks_status ON process_subtasks(status);

-- Add helpful views for production planning
CREATE OR REPLACE VIEW production_lot_summary AS
SELECT 
  pl.id,
  pl.lot_number,
  pl.status,
  pl.priority,
  pl.production_quantity,
  pl.planned_start_date,
  pl.planned_end_date,
  pl.total_estimated_cost,
  b.name as bom_name,
  b.version as bom_version,
  p.name as project_name,
  COUNT(DISTINCT pp.id) as total_processes,
  COUNT(DISTINCT CASE WHEN pp.status = 'completed' THEN pp.id END) as completed_processes,
  COALESCE(AVG(pp.completion_percentage), 0) as overall_progress,
  COUNT(DISTINCT lva.id) as vendor_assignments,
  COUNT(DISTINCT CASE WHEN lva.delivery_status = 'delivered' THEN lva.id END) as delivered_assignments
FROM production_lots pl
LEFT JOIN boms b ON b.id = pl.bom_id
LEFT JOIN projects p ON p.id = b.project_id
LEFT JOIN production_processes pp ON pp.production_lot_id = pl.id
LEFT JOIN lot_vendor_assignments lva ON lva.production_lot_id = pl.id
GROUP BY pl.id, b.id, p.id;

-- Add helpful function to generate lot numbers
CREATE OR REPLACE FUNCTION generate_lot_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  current_date_str VARCHAR(8);
  sequence_num INTEGER;
  lot_number VARCHAR(50);
BEGIN
  -- Format: LOT-YYYYMMDD-XXX
  current_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(lot_number FROM 'LOT-' || current_date_str || '-(\d+)')
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM production_lots
  WHERE lot_number LIKE 'LOT-' || current_date_str || '-%';
  
  -- Generate lot number
  lot_number := 'LOT-' || current_date_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN lot_number;
END;
$$ LANGUAGE plpgsql;

-- Add function to calculate lot material costs
CREATE OR REPLACE FUNCTION calculate_lot_material_cost(lot_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  total_cost DECIMAL(15,2);
BEGIN
  SELECT COALESCE(SUM(lva.total_cost), 0)
  INTO total_cost
  FROM lot_vendor_assignments lva
  WHERE lva.production_lot_id = lot_id;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update material costs
CREATE OR REPLACE FUNCTION update_lot_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE production_lots 
  SET 
    total_material_cost = calculate_lot_material_cost(
      COALESCE(NEW.production_lot_id, OLD.production_lot_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.production_lot_id, OLD.production_lot_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cost updates
DROP TRIGGER IF EXISTS trigger_update_lot_costs ON lot_vendor_assignments;
CREATE TRIGGER trigger_update_lot_costs
  AFTER INSERT OR UPDATE OR DELETE ON lot_vendor_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_lot_costs();

-- Add constraints to ensure data integrity
DO $$
BEGIN
  -- Ensure lot numbers are unique
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_lot_number'
  ) THEN
    ALTER TABLE production_lots 
    ADD CONSTRAINT unique_lot_number UNIQUE (lot_number);
  END IF;
  
  -- Ensure process sequence is unique per lot
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_lot_process_sequence'
  ) THEN
    ALTER TABLE production_processes 
    ADD CONSTRAINT unique_lot_process_sequence 
    UNIQUE (production_lot_id, process_sequence);
  END IF;
  
  -- Ensure vendor assignments are unique per lot+item
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_lot_vendor_assignment'
  ) THEN
    ALTER TABLE lot_vendor_assignments 
    ADD CONSTRAINT unique_lot_vendor_assignment 
    UNIQUE (production_lot_id, bom_item_id);
  END IF;
END $$;

COMMENT ON VIEW production_lot_summary IS 'Aggregated view of production lots with progress metrics';
COMMENT ON FUNCTION generate_lot_number() IS 'Auto-generates unique lot numbers in format LOT-YYYYMMDD-XXX';
COMMENT ON FUNCTION calculate_lot_material_cost(UUID) IS 'Calculates total material cost for a production lot';

-- Final setup complete
DO $$
BEGIN
  RAISE NOTICE 'Production planning system cleaned and optimized successfully!';
  RAISE NOTICE 'Views created: production_lot_summary';
  RAISE NOTICE 'Functions created: generate_lot_number(), calculate_lot_material_cost()';
  RAISE NOTICE 'Triggers created: automatic cost calculation';
  RAISE NOTICE 'System ready for production use!';
END $$;