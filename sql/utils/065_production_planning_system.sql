-- ============================================================================
-- MIGRATION 065: Production Planning Module for OEM Manufacturing
-- ============================================================================
-- This migration creates tables for comprehensive production planning:
-- - production_lots: Production batches with BOM references
-- - lot_vendor_assignments: Vendor mappings for lot materials
-- - production_processes: Manufacturing processes per lot
-- - process_subtasks: Detailed tasks within processes
-- - daily_production_entries: Daily production tracking
-- - production_schedules: Gantt chart scheduling
-- ============================================================================

-- ============================================================================
-- TABLE: production_lots
-- ============================================================================
-- Production lots represent quantities to be manufactured from a BOM
CREATE TABLE IF NOT EXISTS production_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE RESTRICT,
    lot_number VARCHAR(100) NOT NULL UNIQUE,
    production_quantity INTEGER NOT NULL CHECK (production_quantity > 0),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'planned' CHECK (
        status IN ('planned', 'materials_ordered', 'in_production', 'completed', 'cancelled', 'on_hold')
    ),
    
    -- Dates
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Priority and classification
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    lot_type VARCHAR(50) DEFAULT 'standard' CHECK (lot_type IN ('standard', 'prototype', 'rework', 'urgent')),
    
    -- Auto-calculated requirements
    total_material_cost DECIMAL(15, 2) DEFAULT 0,
    total_process_cost DECIMAL(15, 2) DEFAULT 0,
    total_estimated_cost DECIMAL(15, 2) DEFAULT 0,
    
    -- Notes and tracking
    remarks TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_lots_bom_id ON production_lots(bom_id);
CREATE INDEX IF NOT EXISTS idx_production_lots_status ON production_lots(status);
CREATE INDEX IF NOT EXISTS idx_production_lots_dates ON production_lots(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_production_lots_created_by ON production_lots(created_by);

-- ============================================================================
-- TABLE: lot_vendor_assignments
-- ============================================================================
-- Maps vendors to specific materials in a production lot
CREATE TABLE IF NOT EXISTS lot_vendor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    
    -- Quantities and costs
    required_quantity DECIMAL(12, 3) NOT NULL CHECK (required_quantity > 0),
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    
    -- Delivery tracking
    delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (
        delivery_status IN ('pending', 'ordered', 'confirmed', 'shipped', 'delivered', 'delayed')
    ),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Quality and notes
    quality_status VARCHAR(50) DEFAULT 'pending' CHECK (
        quality_status IN ('pending', 'inspected', 'approved', 'rejected', 'rework_required')
    ),
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one vendor per material per lot
    UNIQUE(production_lot_id, bom_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lot_vendor_assignments_lot_id ON lot_vendor_assignments(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_vendor_assignments_vendor_id ON lot_vendor_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_lot_vendor_assignments_delivery_status ON lot_vendor_assignments(delivery_status);

-- ============================================================================
-- TABLE: production_processes
-- ============================================================================
-- Manufacturing processes for each production lot
CREATE TABLE IF NOT EXISTS production_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE RESTRICT,
    process_sequence INTEGER NOT NULL,
    
    -- Process details
    process_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scheduling
    planned_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Resource allocation
    assigned_department VARCHAR(100),
    responsible_person VARCHAR(255),
    machine_allocation TEXT, -- JSON array of machine IDs
    
    -- Status and progress
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'ready', 'in_progress', 'completed', 'on_hold', 'cancelled')
    ),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Dependencies
    depends_on_process_id UUID REFERENCES production_processes(id) ON DELETE SET NULL,
    
    -- Quality and notes
    quality_check_required BOOLEAN DEFAULT true,
    quality_status VARCHAR(50) DEFAULT 'pending' CHECK (
        quality_status IN ('pending', 'in_progress', 'passed', 'failed', 'rework_required')
    ),
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique sequence per lot
    UNIQUE(production_lot_id, process_sequence)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_processes_lot_id ON production_processes(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_production_processes_status ON production_processes(status);
CREATE INDEX IF NOT EXISTS idx_production_processes_dates ON production_processes(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_production_processes_sequence ON production_processes(production_lot_id, process_sequence);

-- ============================================================================
-- TABLE: process_subtasks
-- ============================================================================
-- Detailed subtasks within each production process
CREATE TABLE IF NOT EXISTS process_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_process_id UUID NOT NULL REFERENCES production_processes(id) ON DELETE CASCADE,
    
    -- Task details
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    task_sequence INTEGER NOT NULL,
    
    -- Time allocation
    estimated_duration_hours DECIMAL(8, 2) DEFAULT 0,
    actual_duration_hours DECIMAL(8, 2) DEFAULT 0,
    
    -- Assignment
    assigned_operator VARCHAR(255),
    skill_requirement VARCHAR(100),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')
    ),
    
    -- Quality control
    quality_check_required BOOLEAN DEFAULT false,
    quality_check_passed BOOLEAN,
    
    -- Dependencies
    depends_on_subtask_id UUID REFERENCES process_subtasks(id) ON DELETE SET NULL,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique sequence per process
    UNIQUE(production_process_id, task_sequence)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_process_subtasks_process_id ON process_subtasks(production_process_id);
CREATE INDEX IF NOT EXISTS idx_process_subtasks_status ON process_subtasks(status);
CREATE INDEX IF NOT EXISTS idx_process_subtasks_operator ON process_subtasks(assigned_operator);

-- ============================================================================
-- TABLE: daily_production_entries
-- ============================================================================
-- Daily/Weekly production quantity entries
CREATE TABLE IF NOT EXISTS daily_production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    production_process_id UUID REFERENCES production_processes(id) ON DELETE CASCADE,
    
    -- Entry details
    entry_date DATE NOT NULL,
    entry_type VARCHAR(20) DEFAULT 'daily' CHECK (entry_type IN ('daily', 'weekly', 'shift')),
    
    -- Production tracking
    planned_quantity INTEGER DEFAULT 0,
    actual_quantity INTEGER DEFAULT 0,
    rejected_quantity INTEGER DEFAULT 0,
    rework_quantity INTEGER DEFAULT 0,
    
    -- Efficiency metrics
    efficiency_percentage DECIMAL(5, 2) DEFAULT 0,
    downtime_hours DECIMAL(6, 2) DEFAULT 0,
    downtime_reason TEXT,
    
    -- Operator and shift info
    shift VARCHAR(50),
    operators_count INTEGER DEFAULT 1,
    supervisor VARCHAR(255),
    
    -- Notes
    remarks TEXT,
    issues_encountered TEXT,
    
    -- Entry metadata
    entered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate entries per date
    UNIQUE(production_lot_id, production_process_id, entry_date, entry_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_production_entries_lot_id ON daily_production_entries(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_daily_production_entries_date ON daily_production_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_production_entries_process_id ON daily_production_entries(production_process_id);

-- ============================================================================
-- TABLE: production_schedules
-- ============================================================================
-- Gantt chart scheduling data
CREATE TABLE IF NOT EXISTS production_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    production_process_id UUID REFERENCES production_processes(id) ON DELETE CASCADE,
    
    -- Schedule details
    schedule_type VARCHAR(50) DEFAULT 'process' CHECK (schedule_type IN ('lot', 'process', 'subtask', 'milestone')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timeline
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Resource allocation
    allocated_resources TEXT, -- JSON array of resource IDs
    resource_utilization_percentage INTEGER DEFAULT 100,
    
    -- Dependencies for Gantt chart
    predecessor_schedule_id UUID REFERENCES production_schedules(id) ON DELETE SET NULL,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start' CHECK (
        dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')
    ),
    lag_days INTEGER DEFAULT 0,
    
    -- Status and tracking
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'active', 'completed', 'delayed', 'cancelled')
    ),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_schedules_lot_id ON production_schedules(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_process_id ON production_schedules(production_process_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_timeline ON production_schedules(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_production_schedules_status ON production_schedules(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE production_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_vendor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_lots
CREATE POLICY "Users can manage production_lots for their BOMs"
    ON production_lots FOR ALL
    USING (EXISTS (
        SELECT 1 FROM boms b
        WHERE b.id = production_lots.bom_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for lot_vendor_assignments
CREATE POLICY "Users can manage lot_vendor_assignments"
    ON lot_vendor_assignments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = lot_vendor_assignments.production_lot_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for production_processes
CREATE POLICY "Users can manage production_processes"
    ON production_processes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = production_processes.production_lot_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for process_subtasks
CREATE POLICY "Users can manage process_subtasks"
    ON process_subtasks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_processes pp
        JOIN production_lots pl ON pl.id = pp.production_lot_id
        JOIN boms b ON b.id = pl.bom_id
        WHERE pp.id = process_subtasks.production_process_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for daily_production_entries
CREATE POLICY "Users can manage daily_production_entries"
    ON daily_production_entries FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = daily_production_entries.production_lot_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for production_schedules
CREATE POLICY "Users can manage production_schedules"
    ON production_schedules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = production_schedules.production_lot_id AND b.user_id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_production_lots_updated_at BEFORE UPDATE ON production_lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lot_vendor_assignments_updated_at BEFORE UPDATE ON lot_vendor_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_processes_updated_at BEFORE UPDATE ON production_processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_process_subtasks_updated_at BEFORE UPDATE ON process_subtasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_production_entries_updated_at BEFORE UPDATE ON daily_production_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_schedules_updated_at BEFORE UPDATE ON production_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR AUTO-CALCULATION
-- ============================================================================

-- Function to calculate total lot cost
CREATE OR REPLACE FUNCTION calculate_lot_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Update material cost from vendor assignments
    UPDATE production_lots SET
        total_material_cost = COALESCE((
            SELECT SUM(total_cost)
            FROM lot_vendor_assignments
            WHERE production_lot_id = NEW.production_lot_id
        ), 0)
    WHERE id = NEW.production_lot_id;
    
    -- Update total estimated cost
    UPDATE production_lots SET
        total_estimated_cost = total_material_cost + total_process_cost
    WHERE id = NEW.production_lot_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for lot cost calculation
CREATE TRIGGER trigger_calculate_lot_cost
    AFTER INSERT OR UPDATE OR DELETE ON lot_vendor_assignments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_lot_total_cost();

-- Function to update process completion percentage
CREATE OR REPLACE FUNCTION update_process_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update process completion based on subtasks
    UPDATE production_processes SET
        completion_percentage = COALESCE((
            SELECT ROUND(AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END))
            FROM process_subtasks
            WHERE production_process_id = NEW.production_process_id
        ), 0)
    WHERE id = NEW.production_process_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for process completion calculation
CREATE TRIGGER trigger_update_process_completion
    AFTER INSERT OR UPDATE OR DELETE ON process_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_process_completion();

-- ============================================================================
-- END OF MIGRATION 065
-- ============================================================================