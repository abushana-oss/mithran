-- ============================================================================
-- MIGRATION 026: Process Planning Redesign Schema
-- ============================================================================
-- This migration enhances the process planning system with:
-- - Workflow state tracking for process routes
-- - Role-based access control
-- - Session/context management
-- - Audit trail for workflow changes
-- - Integration points for calculator mappings
-- ============================================================================

-- ============================================================================
-- Add workflow state tracking to process_routes
-- ============================================================================
ALTER TABLE process_routes
ADD COLUMN workflow_state VARCHAR(50) DEFAULT 'draft'
  CHECK (workflow_state IN ('draft', 'in_review', 'approved', 'active', 'archived')),
ADD COLUMN workflow_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN workflow_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_process_routes_workflow_state
  ON process_routes(workflow_state);

COMMENT ON COLUMN process_routes.workflow_state IS 'Current workflow state: draft, in_review, approved, active, archived';
COMMENT ON COLUMN process_routes.workflow_updated_at IS 'Timestamp of last workflow state change';
COMMENT ON COLUMN process_routes.workflow_updated_by IS 'User who last changed the workflow state';
COMMENT ON COLUMN process_routes.approved_by IS 'User who approved this route';
COMMENT ON COLUMN process_routes.approved_at IS 'Timestamp when route was approved';

-- ============================================================================
-- Add role-based fields to process_routes
-- ============================================================================
ALTER TABLE process_routes
ADD COLUMN created_by_role VARCHAR(50) DEFAULT 'process_planner'
  CHECK (created_by_role IN ('process_planner', 'production_manager', 'design_engineer', 'shop_floor_user')),
ADD COLUMN assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN priority VARCHAR(20) DEFAULT 'normal'
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

COMMENT ON COLUMN process_routes.created_by_role IS 'Role of the user who created this route';
COMMENT ON COLUMN process_routes.assigned_to IS 'User assigned to work on this route';
COMMENT ON COLUMN process_routes.priority IS 'Priority level: low, normal, high, urgent';

-- ============================================================================
-- Add process_group and process_category for tab filtering
-- ============================================================================
ALTER TABLE process_routes
ADD COLUMN process_group VARCHAR(100),
ADD COLUMN process_category VARCHAR(100);

CREATE INDEX idx_process_routes_process_group
  ON process_routes(process_group);

COMMENT ON COLUMN process_routes.process_group IS 'Process category group for tab filtering (e.g., Machining, Sheet Metal, Assembly, Plastic & Rubber, Post Processing, Packing & Delivery)';
COMMENT ON COLUMN process_routes.process_category IS 'Specific process category within the group';

-- ============================================================================
-- Create process_route_workflow_history table
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_route_workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_route_id UUID NOT NULL REFERENCES process_routes(id) ON DELETE CASCADE,
  from_state VARCHAR(50),
  to_state VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_by_role VARCHAR(50),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflow_history_route_id
  ON process_route_workflow_history(process_route_id);
CREATE INDEX idx_workflow_history_created_at
  ON process_route_workflow_history(created_at DESC);

COMMENT ON TABLE process_route_workflow_history IS 'Audit trail of workflow state changes for process routes';
COMMENT ON COLUMN process_route_workflow_history.from_state IS 'Previous workflow state (null for initial state)';
COMMENT ON COLUMN process_route_workflow_history.to_state IS 'New workflow state after transition';
COMMENT ON COLUMN process_route_workflow_history.changed_by IS 'User who performed the state transition';
COMMENT ON COLUMN process_route_workflow_history.changed_by_role IS 'Role of the user at time of transition';
COMMENT ON COLUMN process_route_workflow_history.comment IS 'Optional comment explaining the transition';

-- ============================================================================
-- Create user_roles table for role-based access
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'process_planner',
    'production_manager',
    'shop_floor_user',
    'design_engineer'
  )),
  is_primary BOOLEAN DEFAULT false,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_primary ON user_roles(user_id, is_primary) WHERE is_primary = true;

COMMENT ON TABLE user_roles IS 'Role assignments for users - supports multiple roles per user';
COMMENT ON COLUMN user_roles.role IS 'User role: process_planner, production_manager, shop_floor_user, design_engineer';
COMMENT ON COLUMN user_roles.is_primary IS 'Whether this is the user''s primary/default role';
COMMENT ON COLUMN user_roles.organization_id IS 'Organization context for this role assignment';

-- ============================================================================
-- Create process_planning_sessions table for context management
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
  process_route_id UUID REFERENCES process_routes(id) ON DELETE SET NULL,
  active_category VARCHAR(100),
  active_role VARCHAR(50),
  session_data JSONB DEFAULT '{}'::jsonb,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bom_item_id)
);

CREATE INDEX idx_sessions_user_id ON process_planning_sessions(user_id);
CREATE INDEX idx_sessions_last_accessed
  ON process_planning_sessions(last_accessed_at DESC);
CREATE INDEX idx_sessions_bom_item ON process_planning_sessions(bom_item_id);

COMMENT ON TABLE process_planning_sessions IS 'Preserves user context and UI state for process planning sessions';
COMMENT ON COLUMN process_planning_sessions.bom_item_id IS 'BOM item being worked on in this session';
COMMENT ON COLUMN process_planning_sessions.process_route_id IS 'Currently selected process route';
COMMENT ON COLUMN process_planning_sessions.active_category IS 'Last active process category tab';
COMMENT ON COLUMN process_planning_sessions.active_role IS 'Role user was in during this session';
COMMENT ON COLUMN process_planning_sessions.session_data IS 'Additional UI state (expanded cards, filters, etc.)';
COMMENT ON COLUMN process_planning_sessions.last_accessed_at IS 'Timestamp of last session activity';

-- ============================================================================
-- Update process_route_steps with calculator reference
-- ============================================================================
ALTER TABLE process_route_steps
ADD COLUMN calculator_mapping_id UUID
  REFERENCES process_calculator_mappings(id) ON DELETE SET NULL,
ADD COLUMN extracted_values JSONB DEFAULT '{}'::jsonb,
ADD COLUMN is_completed BOOLEAN DEFAULT false;

CREATE INDEX idx_process_route_steps_calculator_mapping
  ON process_route_steps(calculator_mapping_id);
CREATE INDEX idx_process_route_steps_completed
  ON process_route_steps(process_route_id, is_completed);

COMMENT ON COLUMN process_route_steps.calculator_mapping_id IS 'Link to calculator used for this step';
COMMENT ON COLUMN process_route_steps.extracted_values IS 'Calculated values from calculator execution (costs, times, etc.)';
COMMENT ON COLUMN process_route_steps.is_completed IS 'Whether this step has been completed (for shop floor tracking)';

-- ============================================================================
-- RLS Policies for new tables
-- ============================================================================
ALTER TABLE process_route_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_planning_sessions ENABLE ROW LEVEL SECURITY;

-- Workflow history: Users can view history for routes they have access to
CREATE POLICY "Users can view workflow history for their routes"
  ON process_route_workflow_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM process_routes pr
    JOIN bom_items bi ON bi.id = pr.bom_item_id
    JOIN boms b ON b.id = bi.bom_id
    WHERE pr.id = process_route_workflow_history.process_route_id
      AND b.user_id = auth.uid()
  ));

-- User roles: Users can manage their own roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles"
  ON user_roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'production_manager'
  ));

-- Sessions: Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions"
  ON process_planning_sessions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- Trigger to update workflow_updated_at and log history
-- ============================================================================
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workflow_state IS DISTINCT FROM OLD.workflow_state THEN
    NEW.workflow_updated_at = NOW();
    NEW.workflow_updated_by = auth.uid();

    -- Insert into history table
    INSERT INTO process_route_workflow_history (
      process_route_id, from_state, to_state, changed_by
    ) VALUES (
      NEW.id, OLD.workflow_state, NEW.workflow_state, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_workflow_timestamp
  BEFORE UPDATE ON process_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

COMMENT ON FUNCTION update_workflow_timestamp() IS 'Auto-updates workflow_updated_at and logs state changes to history';

-- ============================================================================
-- Trigger to update updated_at for user_roles
-- ============================================================================
CREATE TRIGGER trigger_update_user_roles_timestamp
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function to ensure only one primary role per user
-- ============================================================================
CREATE OR REPLACE FUNCTION ensure_single_primary_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary roles for this user
    UPDATE user_roles
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_role
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_role();

COMMENT ON FUNCTION ensure_single_primary_role() IS 'Ensures only one role per user can be marked as primary';

-- ============================================================================
-- Trigger to update last_accessed_at on session updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_session_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_last_accessed
  BEFORE UPDATE ON process_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_accessed();

-- ============================================================================
-- View: Process Routes with User and BOM Details
-- ============================================================================
CREATE OR REPLACE VIEW process_routes_detailed AS
SELECT
  pr.*,
  bi.part_number,
  bi.name as bom_item_name,
  b.name as bom_name,
  u.email as created_by_email,
  au.email as approved_by_email,
  wu.email as workflow_updated_by_email
FROM process_routes pr
LEFT JOIN bom_items bi ON bi.id = pr.bom_item_id
LEFT JOIN boms b ON b.id = bi.bom_id
LEFT JOIN auth.users u ON u.id = pr.user_id
LEFT JOIN auth.users au ON au.id = pr.approved_by
LEFT JOIN auth.users wu ON wu.id = pr.workflow_updated_by;

COMMENT ON VIEW process_routes_detailed IS 'Process routes with joined user and BOM information for easier querying';

-- ============================================================================
-- View: Workflow History with User Details
-- ============================================================================
CREATE OR REPLACE VIEW workflow_history_detailed AS
SELECT
  wh.*,
  pr.name as route_name,
  u.email as changed_by_email
FROM process_route_workflow_history wh
LEFT JOIN process_routes pr ON pr.id = wh.process_route_id
LEFT JOIN auth.users u ON u.id = wh.changed_by;

COMMENT ON VIEW workflow_history_detailed IS 'Workflow history with joined route and user information';

-- ============================================================================
-- Seed initial workflow states for existing routes
-- ============================================================================
-- Set all existing process_routes to 'draft' state (already done via DEFAULT)
-- This ensures backwards compatibility with existing data

UPDATE process_routes
SET workflow_state = 'draft'
WHERE workflow_state IS NULL;

-- ============================================================================
-- End of Migration 026
-- ============================================================================
