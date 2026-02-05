-- ============================================================================
-- PRODUCTION PLANNING SETUP SCRIPT
-- Run this in Supabase SQL Editor to set up your production system
-- ============================================================================

-- First, ensure the production planning tables exist
-- (These should already be there if you ran migrations 065 and 066)

-- ============================================================================
-- MATERIAL TRACKING TABLES (Migration 067)
-- ============================================================================

-- Production lot materials table for enhanced tracking
CREATE TABLE IF NOT EXISTS production_lot_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE RESTRICT,
    
    -- Material quantities
    required_quantity DECIMAL(12, 3) NOT NULL CHECK (required_quantity > 0),
    ordered_quantity DECIMAL(12, 3) DEFAULT 0,
    received_quantity DECIMAL(12, 3) DEFAULT 0,
    inspected_quantity DECIMAL(12, 3) DEFAULT 0,
    approved_quantity DECIMAL(12, 3) DEFAULT 0,
    rejected_quantity DECIMAL(12, 3) DEFAULT 0,
    consumed_quantity DECIMAL(12, 3) DEFAULT 0,
    
    -- Status tracking
    material_status VARCHAR(50) DEFAULT 'planning' CHECK (
        material_status IN ('planning', 'ordered', 'shipped', 'received', 'inspected', 'approved', 'in_use', 'depleted')
    ),
    
    -- Vendor and cost information
    assigned_vendor_id UUID REFERENCES vendors(id),
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    estimated_cost DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2),
    
    -- Delivery tracking
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    received_date DATE,
    inspection_date DATE,
    approval_date DATE,
    
    -- Quality and specifications
    specifications TEXT,
    criticality VARCHAR(20) DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
    lead_time_days INTEGER DEFAULT 0,
    buffer_stock DECIMAL(10, 3) DEFAULT 0,
    reorder_point DECIMAL(10, 3) DEFAULT 0,
    
    -- Batch tracking
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    storage_location VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(production_lot_id, bom_item_id)
);

-- Material tracking history table
CREATE TABLE IF NOT EXISTS material_tracking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_material_id UUID NOT NULL REFERENCES production_lot_materials(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('ordered', 'shipped', 'received', 'inspected', 'approved', 'rejected', 'consumed', 'returned', 'adjusted')
    ),
    quantity DECIMAL(12, 3) NOT NULL,
    previous_quantity DECIMAL(12, 3) DEFAULT 0,
    new_quantity DECIMAL(12, 3) NOT NULL,
    
    -- Context information
    batch_number VARCHAR(100),
    supplier_reference VARCHAR(255),
    storage_location VARCHAR(255),
    notes TEXT,
    quality_notes TEXT,
    
    -- Responsibility
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_by_name VARCHAR(255),
    
    -- Timestamps
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production material alerts table
CREATE TABLE IF NOT EXISTS production_material_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    production_lot_material_id UUID REFERENCES production_lot_materials(id) ON DELETE CASCADE,
    production_process_id UUID REFERENCES production_processes(id) ON DELETE CASCADE,
    
    -- Alert classification
    alert_type VARCHAR(50) NOT NULL CHECK (
        alert_type IN ('delay', 'shortage', 'quality', 'reorder', 'expiry', 'process_blocked', 'vendor_issue')
    ),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source VARCHAR(20) NOT NULL CHECK (source IN ('monitoring', 'bom', 'system', 'manual')),
    
    -- Alert content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    impact_description TEXT,
    suggested_action TEXT,
    
    -- Status and resolution
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    
    -- Affected items (JSON arrays for related IDs)
    affected_processes JSONB DEFAULT '[]',
    affected_materials JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production monitoring metrics table
CREATE TABLE IF NOT EXISTS production_monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    production_process_id UUID REFERENCES production_processes(id) ON DELETE CASCADE,
    
    -- Metric details
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (
        metric_type IN ('production_output', 'quality_rate', 'efficiency', 'downtime', 'material_consumption')
    ),
    
    -- Production metrics
    planned_output INTEGER DEFAULT 0,
    actual_output INTEGER DEFAULT 0,
    accepted_output INTEGER DEFAULT 0,
    rejected_output INTEGER DEFAULT 0,
    rework_output INTEGER DEFAULT 0,
    
    -- Quality metrics
    quality_rate DECIMAL(5, 2) DEFAULT 0,
    first_pass_yield DECIMAL(5, 2) DEFAULT 0,
    defect_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Efficiency metrics
    efficiency_percentage DECIMAL(5, 2) DEFAULT 0,
    utilization_rate DECIMAL(5, 2) DEFAULT 0,
    throughput_rate DECIMAL(10, 2) DEFAULT 0,
    
    -- Time tracking
    planned_hours DECIMAL(8, 2) DEFAULT 0,
    actual_hours DECIMAL(8, 2) DEFAULT 0,
    downtime_hours DECIMAL(8, 2) DEFAULT 0,
    downtime_reason TEXT,
    
    -- Material consumption
    material_efficiency DECIMAL(5, 2) DEFAULT 0,
    waste_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Context
    shift VARCHAR(50),
    operator_count INTEGER DEFAULT 1,
    notes TEXT,
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one metric per type per date per lot/process
    UNIQUE(production_lot_id, production_process_id, metric_date, metric_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Production lot materials indexes
CREATE INDEX IF NOT EXISTS idx_prod_lot_materials_lot_id ON production_lot_materials(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_prod_lot_materials_bom_item ON production_lot_materials(bom_item_id);
CREATE INDEX IF NOT EXISTS idx_prod_lot_materials_status ON production_lot_materials(material_status);
CREATE INDEX IF NOT EXISTS idx_prod_lot_materials_vendor ON production_lot_materials(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_prod_lot_materials_criticality ON production_lot_materials(criticality);

-- Material tracking history indexes
CREATE INDEX IF NOT EXISTS idx_mat_tracking_history_material ON material_tracking_history(production_lot_material_id);
CREATE INDEX IF NOT EXISTS idx_mat_tracking_history_action ON material_tracking_history(action);
CREATE INDEX IF NOT EXISTS idx_mat_tracking_history_date ON material_tracking_history(performed_at);
CREATE INDEX IF NOT EXISTS idx_mat_tracking_history_user ON material_tracking_history(performed_by);

-- Production material alerts indexes
CREATE INDEX IF NOT EXISTS idx_prod_alerts_lot_id ON production_material_alerts(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_prod_alerts_material_id ON production_material_alerts(production_lot_material_id);
CREATE INDEX IF NOT EXISTS idx_prod_alerts_process_id ON production_material_alerts(production_process_id);
CREATE INDEX IF NOT EXISTS idx_prod_alerts_type_severity ON production_material_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_prod_alerts_status ON production_material_alerts(status);
CREATE INDEX IF NOT EXISTS idx_prod_alerts_created ON production_material_alerts(created_at);

-- Production monitoring metrics indexes
CREATE INDEX IF NOT EXISTS idx_prod_metrics_lot_id ON production_monitoring_metrics(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_process_id ON production_monitoring_metrics(production_process_id);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_date ON production_monitoring_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_prod_metrics_type ON production_monitoring_metrics(metric_type);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE production_lot_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_material_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_monitoring_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_lot_materials
DROP POLICY IF EXISTS "Users can manage materials for their production lots" ON production_lot_materials;
CREATE POLICY "Users can manage materials for their production lots"
    ON production_lot_materials FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = production_lot_materials.production_lot_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for material_tracking_history
DROP POLICY IF EXISTS "Users can view tracking history for their materials" ON material_tracking_history;
CREATE POLICY "Users can view tracking history for their materials"
    ON material_tracking_history FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lot_materials plm
        JOIN production_lots pl ON pl.id = plm.production_lot_id
        JOIN boms b ON b.id = pl.bom_id
        WHERE plm.id = material_tracking_history.production_lot_material_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for production_material_alerts
DROP POLICY IF EXISTS "Users can manage alerts for their production lots" ON production_material_alerts;
CREATE POLICY "Users can manage alerts for their production lots"
    ON production_material_alerts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = production_material_alerts.production_lot_id AND b.user_id = auth.uid()
    ));

-- RLS Policies for production_monitoring_metrics
DROP POLICY IF EXISTS "Users can manage metrics for their production lots" ON production_monitoring_metrics;
CREATE POLICY "Users can manage metrics for their production lots"
    ON production_monitoring_metrics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM production_lots pl
        JOIN boms b ON b.id = pl.bom_id
        WHERE pl.id = production_monitoring_metrics.production_lot_id AND b.user_id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_production_lot_materials_updated_at ON production_lot_materials;
CREATE TRIGGER update_production_lot_materials_updated_at BEFORE UPDATE ON production_lot_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_material_alerts_updated_at ON production_material_alerts;
CREATE TRIGGER update_production_material_alerts_updated_at BEFORE UPDATE ON production_material_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_monitoring_metrics_updated_at ON production_monitoring_metrics;
CREATE TRIGGER update_production_monitoring_metrics_updated_at BEFORE UPDATE ON production_monitoring_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTION FOR MATERIAL READINESS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_material_readiness_percentage(lot_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_required DECIMAL(15,3);
    total_approved DECIMAL(15,3);
    readiness_percentage DECIMAL(5,2);
BEGIN
    SELECT 
        SUM(required_quantity),
        SUM(approved_quantity)
    INTO total_required, total_approved
    FROM production_lot_materials 
    WHERE production_lot_id = lot_id;
    
    IF total_required > 0 THEN
        readiness_percentage := (COALESCE(total_approved, 0) / total_required) * 100;
    ELSE
        readiness_percentage := 100;
    END IF;
    
    RETURN LEAST(readiness_percentage, 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Optional - Remove if you want clean setup)
-- ============================================================================

-- Insert a sample production lot (you'll need to replace the BOM ID with a real one)
-- INSERT INTO production_lots (id, bom_id, lot_number, production_quantity, planned_start_date, planned_end_date, status, priority, created_by)
-- VALUES (
--     uuid_generate_v4(),
--     'your-bom-id-here',
--     'LOT-20260205-001',
--     10,
--     '2026-02-05',
--     '2026-02-15',
--     'planned',
--     'medium',
--     auth.uid()
-- );

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- To verify everything is set up correctly:
SELECT 
    'production_lot_materials' as table_name, 
    count(*) as row_count 
FROM production_lot_materials
UNION ALL
SELECT 
    'material_tracking_history' as table_name, 
    count(*) as row_count 
FROM material_tracking_history
UNION ALL
SELECT 
    'production_material_alerts' as table_name, 
    count(*) as row_count 
FROM production_material_alerts
UNION ALL
SELECT 
    'production_monitoring_metrics' as table_name, 
    count(*) as row_count 
FROM production_monitoring_metrics;

-- Success message
SELECT 'Production Planning Setup Complete!' as status;