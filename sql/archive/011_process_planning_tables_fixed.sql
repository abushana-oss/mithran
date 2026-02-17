-- ============================================================================
-- MIGRATION 011: Process Planning Tables - FIXED
-- ============================================================================
-- This is a safe version that can be re-run without errors
-- ============================================================================

-- ============================================================================
-- TABLE: process_routes
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_template BOOLEAN DEFAULT false,
    template_name VARCHAR(255),
    -- Auto-calculated totals (updated via cost calculation endpoint)
    total_setup_time_minutes DECIMAL(10, 2) DEFAULT 0,
    total_cycle_time_minutes DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    -- Ownership and timestamps
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for process_routes
CREATE INDEX IF NOT EXISTS idx_process_routes_bom_item_id ON process_routes(bom_item_id);
CREATE INDEX IF NOT EXISTS idx_process_routes_user_id ON process_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_process_routes_template ON process_routes(is_template, template_name) WHERE is_template = true;

-- ============================================================================
-- TABLE: process_route_steps
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_route_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_route_id UUID NOT NULL REFERENCES process_routes(id) ON DELETE CASCADE,
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE RESTRICT,
    step_number INTEGER NOT NULL,
    operation_name VARCHAR(255) NOT NULL,
    -- Time tracking
    setup_time_minutes DECIMAL(10, 2) DEFAULT 0,
    cycle_time_minutes DECIMAL(10, 2) DEFAULT 0,
    -- Cost calculation fields
    labor_hours DECIMAL(10, 2) DEFAULT 0,
    machine_hours DECIMAL(10, 2) DEFAULT 0,
    machine_hour_rate_id UUID REFERENCES machine_hour_rates(id) ON DELETE SET NULL,
    labor_hour_rate_id UUID REFERENCES labor_hour_rates(id) ON DELETE SET NULL,
    calculated_cost DECIMAL(15, 2) DEFAULT 0,
    -- Additional notes
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure unique step numbers within a route
    UNIQUE(process_route_id, step_number)
);

-- Indexes for process_route_steps
CREATE INDEX IF NOT EXISTS idx_process_route_steps_route_id ON process_route_steps(process_route_id);
CREATE INDEX IF NOT EXISTS idx_process_route_steps_process_id ON process_route_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_process_route_steps_step_number ON process_route_steps(process_route_id, step_number);

-- ============================================================================
-- TABLE: process_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    -- Ownership and timestamps
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for process_templates
CREATE INDEX IF NOT EXISTS idx_process_templates_user_id ON process_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_process_templates_category ON process_templates(category);

-- ============================================================================
-- TABLE: process_template_steps
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_template_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_template_id UUID NOT NULL REFERENCES process_templates(id) ON DELETE CASCADE,
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE RESTRICT,
    step_number INTEGER NOT NULL,
    operation_name VARCHAR(255) NOT NULL,
    -- Default times (can be overridden when applied to a specific item)
    default_setup_time_minutes DECIMAL(10, 2) DEFAULT 0,
    default_cycle_time_minutes DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure unique step numbers within a template
    UNIQUE(process_template_id, step_number)
);

-- Indexes for process_template_steps
CREATE INDEX IF NOT EXISTS idx_process_template_steps_template_id ON process_template_steps(process_template_id);
CREATE INDEX IF NOT EXISTS idx_process_template_steps_process_id ON process_template_steps(process_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE process_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_route_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_template_steps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: process_routes - Drop and recreate to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view process_routes for their bom items" ON process_routes;
CREATE POLICY "Users can view process_routes for their bom items"
    ON process_routes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM bom_items bi
        JOIN boms b ON b.id = bi.bom_id
        WHERE bi.id = process_routes.bom_item_id AND b.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert process_routes for their bom items" ON process_routes;
CREATE POLICY "Users can insert process_routes for their bom items"
    ON process_routes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM bom_items bi
        JOIN boms b ON b.id = bi.bom_id
        WHERE bi.id = process_routes.bom_item_id AND b.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update process_routes for their bom items" ON process_routes;
CREATE POLICY "Users can update process_routes for their bom items"
    ON process_routes FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM bom_items bi
        JOIN boms b ON b.id = bi.bom_id
        WHERE bi.id = process_routes.bom_item_id AND b.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete process_routes for their bom items" ON process_routes;
CREATE POLICY "Users can delete process_routes for their bom items"
    ON process_routes FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM bom_items bi
        JOIN boms b ON b.id = bi.bom_id
        WHERE bi.id = process_routes.bom_item_id AND b.user_id = auth.uid()
    ));

-- ============================================================================
-- RLS POLICIES: process_route_steps
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage process_route_steps" ON process_route_steps;
CREATE POLICY "Users can manage process_route_steps"
    ON process_route_steps FOR ALL
    USING (EXISTS (
        SELECT 1 FROM process_routes pr
        JOIN bom_items bi ON bi.id = pr.bom_item_id
        JOIN boms b ON b.id = bi.bom_id
        WHERE pr.id = process_route_steps.process_route_id AND b.user_id = auth.uid()
    ));

-- ============================================================================
-- RLS POLICIES: process_templates
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their process_templates" ON process_templates;
CREATE POLICY "Users can manage their process_templates"
    ON process_templates FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: process_template_steps
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage process_template_steps" ON process_template_steps;
CREATE POLICY "Users can manage process_template_steps"
    ON process_template_steps FOR ALL
    USING (EXISTS (
        SELECT 1 FROM process_templates pt
        WHERE pt.id = process_template_steps.process_template_id AND pt.user_id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT - Drop and recreate to avoid conflicts
-- ============================================================================

DROP TRIGGER IF EXISTS update_process_routes_updated_at ON process_routes;
CREATE TRIGGER update_process_routes_updated_at BEFORE UPDATE ON process_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_process_route_steps_updated_at ON process_route_steps;
CREATE TRIGGER update_process_route_steps_updated_at BEFORE UPDATE ON process_route_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_process_templates_updated_at ON process_templates;
CREATE TRIGGER update_process_templates_updated_at BEFORE UPDATE ON process_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_process_template_steps_updated_at ON process_template_steps;
CREATE TRIGGER update_process_template_steps_updated_at BEFORE UPDATE ON process_template_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE RLS ON PROCESSES TABLE (if not already enabled)
-- ============================================================================

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for processes table (user-owned) - Drop and recreate
DROP POLICY IF EXISTS "Users can manage their processes" ON processes;
CREATE POLICY "Users can manage their processes"
    ON processes FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- END OF MIGRATION 011 (FIXED)
-- ============================================================================
