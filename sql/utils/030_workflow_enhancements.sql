-- Migration 030: Workflow Enhancements
-- Purpose: Add workflow state management to process routes and steps
-- Implements state machine: draft → in_review → approved → active → archived

-- Add workflow fields to process_routes table
ALTER TABLE process_routes
  ADD COLUMN IF NOT EXISTS workflow_state VARCHAR(50) DEFAULT 'draft'
    CHECK (workflow_state IN ('draft', 'in_review', 'approved', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'machining'
    CHECK (category IN ('machining', 'sheet_metal', 'assembly', 'plastic_rubber', 'post_processing', 'packing_delivery'));


-- Add indices for filtering by workflow state and category
CREATE INDEX IF NOT EXISTS idx_process_routes_workflow_state ON process_routes(workflow_state);
CREATE INDEX IF NOT EXISTS idx_process_routes_category ON process_routes(category);
CREATE INDEX IF NOT EXISTS idx_process_routes_approved_by ON process_routes(approved_by);

-- Add calculator integration fields to process_route_steps
ALTER TABLE process_route_steps
  ADD COLUMN IF NOT EXISTS calculator_id INTEGER REFERENCES calculators(id),
  ADD COLUMN IF NOT EXISTS calculator_inputs JSONB, -- Store calculator input parameters
  ADD COLUMN IF NOT EXISTS estimated_time DECIMAL(10,2), -- Estimated time in minutes
  ADD COLUMN IF NOT EXISTS actual_time DECIMAL(10,2); -- Actual time recorded by shop floor

-- Add indices for calculator integration
CREATE INDEX IF NOT EXISTS idx_process_route_steps_calculator_id ON process_route_steps(calculator_id);

-- Create workflow state history table for audit trail
CREATE TABLE IF NOT EXISTS process_route_workflow_history (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES process_routes(id) ON DELETE CASCADE,
  from_state VARCHAR(50),
  to_state VARCHAR(50) NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  comment TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indices for workflow history queries
CREATE INDEX idx_workflow_history_route_id ON process_route_workflow_history(route_id);
CREATE INDEX idx_workflow_history_changed_at ON process_route_workflow_history(changed_at);
CREATE INDEX idx_workflow_history_changed_by ON process_route_workflow_history(changed_by);

-- Add function to automatically log workflow state changes
CREATE OR REPLACE FUNCTION log_workflow_state_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.workflow_state IS DISTINCT FROM NEW.workflow_state) THEN
    INSERT INTO process_route_workflow_history (route_id, from_state, to_state, changed_by)
    VALUES (NEW.id, OLD.workflow_state, NEW.workflow_state, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically log workflow changes
DROP TRIGGER IF EXISTS process_route_workflow_change_trigger ON process_routes;
CREATE TRIGGER process_route_workflow_change_trigger
AFTER UPDATE ON process_routes
FOR EACH ROW
EXECUTE FUNCTION log_workflow_state_change();

-- Add comments for documentation
COMMENT ON COLUMN process_routes.workflow_state IS 'Current workflow state: draft → in_review → approved → active → archived';
COMMENT ON COLUMN process_routes.category IS 'Process category for tab-based navigation: machining, sheet_metal, assembly, plastic_rubber, post_processing, packing_delivery';
COMMENT ON COLUMN process_routes.approved_by IS 'User ID who approved this route (production_manager role)';
COMMENT ON COLUMN process_routes.approved_at IS 'Timestamp when route was approved';

COMMENT ON COLUMN process_route_steps.calculator_id IS 'Reference to calculator used for time/cost estimation';
COMMENT ON COLUMN process_route_steps.calculator_inputs IS 'JSON object containing calculator input parameters';
COMMENT ON COLUMN process_route_steps.estimated_time IS 'Estimated time in minutes (from calculator or manual entry)';
COMMENT ON COLUMN process_route_steps.actual_time IS 'Actual time in minutes (recorded by shop floor user)';

COMMENT ON TABLE process_route_workflow_history IS 'Audit trail for process route workflow state transitions';
