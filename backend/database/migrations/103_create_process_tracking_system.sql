-- =====================================================
-- Process Tracking System Database Schema
-- =====================================================

-- Table: process_tracking_timelines
-- Stores the overall timeline configuration for production lots
CREATE TABLE IF NOT EXISTS process_tracking_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    timeline_start_date DATE NOT NULL,
    timeline_end_date DATE NOT NULL,
    total_weeks INTEGER NOT NULL,
    week_config JSONB NOT NULL, -- Stores week breakdown: [{"week": 1, "start_date": "2026-02-12", "label": "Week 1"}, ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_timeline_per_lot UNIQUE (production_lot_id)
);

-- Table: process_schedule_tracking
-- Tracks the scheduling and progress of main processes
CREATE TABLE IF NOT EXISTS process_schedule_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_process_id UUID NOT NULL REFERENCES production_processes(id) ON DELETE CASCADE,
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    timeline_id UUID NOT NULL REFERENCES process_tracking_timelines(id) ON DELETE CASCADE,
    
    -- Scheduling Information
    scheduled_start_week INTEGER,
    scheduled_end_week INTEGER,
    scheduled_weeks_duration INTEGER,
    actual_start_week INTEGER,
    actual_end_week INTEGER,
    
    -- Progress Tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING',
    
    -- Timeline Position Data
    timeline_position JSONB, -- Stores visual position data: {"left_percent": 0, "width_percent": 30, "weeks_covered": [1,2,3]}
    
    -- Metadata
    last_updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_process_tracking UNIQUE (production_process_id, timeline_id)
);

-- Table: subtask_schedule_tracking  
-- Tracks the scheduling and progress of subtasks
CREATE TABLE IF NOT EXISTS subtask_schedule_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtask_id UUID NOT NULL REFERENCES process_subtasks(id) ON DELETE CASCADE,
    production_process_id UUID NOT NULL REFERENCES production_processes(id) ON DELETE CASCADE,
    timeline_id UUID NOT NULL REFERENCES process_tracking_timelines(id) ON DELETE CASCADE,
    
    -- Scheduling Information
    scheduled_start_week INTEGER,
    scheduled_end_week INTEGER,
    scheduled_weeks_duration INTEGER,
    actual_start_week INTEGER,
    actual_end_week INTEGER,
    
    -- Progress Tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING',
    
    -- Timeline Position Data
    timeline_position JSONB, -- {"left_percent": 0, "width_percent": 100, "weeks_covered": [1,2,3,4,5,6,7,8,9,10]}
    
    -- Visual Styling
    background_color VARCHAR(20) DEFAULT 'rgb(156, 163, 175)',
    opacity DECIMAL(3,2) DEFAULT 0.80,
    
    -- Metadata
    last_updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_subtask_tracking UNIQUE (subtask_id, timeline_id)
);

-- Table: bom_item_schedule_tracking
-- Tracks BOM items within the timeline (from bom_requirements in subtasks)
CREATE TABLE IF NOT EXISTS bom_item_schedule_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_requirement_id UUID NOT NULL, -- References the bom_requirements table
    subtask_tracking_id UUID NOT NULL REFERENCES subtask_schedule_tracking(id) ON DELETE CASCADE,
    timeline_id UUID NOT NULL REFERENCES process_tracking_timelines(id) ON DELETE CASCADE,
    
    -- BOM Item Info
    bom_item_id UUID NOT NULL,
    part_number VARCHAR(100),
    description TEXT,
    required_quantity INTEGER NOT NULL,
    completed_quantity INTEGER DEFAULT 0,
    unit VARCHAR(20),
    
    -- Scheduling Information  
    scheduled_start_week INTEGER,
    scheduled_end_week INTEGER,
    actual_start_week INTEGER,
    actual_end_week INTEGER,
    
    -- Progress Tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING',
    
    -- Timeline Position Data
    timeline_position JSONB, -- {"left_percent": 0, "width_percent": 100, "weeks_covered": [1,2]}
    
    -- Visual Styling
    background_color VARCHAR(50) DEFAULT 'rgba(59, 130, 246, 0.7)',
    opacity DECIMAL(3,2) DEFAULT 0.70,
    
    -- Metadata
    last_updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: tracking_updates_log
-- Audit log for tracking all changes made to the schedule
CREATE TABLE IF NOT EXISTS tracking_updates_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES process_tracking_timelines(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'process', 'subtask', 'bom_item', 'timeline'
    entity_id UUID NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'schedule_update', 'progress_update', 'status_change'
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_process_tracking_timelines_lot_id ON process_tracking_timelines(production_lot_id);
CREATE INDEX idx_process_schedule_tracking_process_id ON process_schedule_tracking(production_process_id);
CREATE INDEX idx_process_schedule_tracking_timeline_id ON process_schedule_tracking(timeline_id);
CREATE INDEX idx_subtask_schedule_tracking_subtask_id ON subtask_schedule_tracking(subtask_id);
CREATE INDEX idx_subtask_schedule_tracking_timeline_id ON subtask_schedule_tracking(timeline_id);
CREATE INDEX idx_bom_item_schedule_tracking_timeline_id ON bom_item_schedule_tracking(timeline_id);
CREATE INDEX idx_tracking_updates_log_timeline_id ON tracking_updates_log(timeline_id);
CREATE INDEX idx_tracking_updates_log_entity ON tracking_updates_log(entity_type, entity_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) 
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE process_tracking_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_schedule_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtask_schedule_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_item_schedule_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_updates_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can only access their organization's data)
CREATE POLICY "Users can view timelines for their organization" ON process_tracking_timelines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM production_lots pl 
            WHERE pl.id = production_lot_id 
            AND pl.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update timelines for their organization" ON process_tracking_timelines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM production_lots pl 
            WHERE pl.id = production_lot_id 
            AND pl.created_by = auth.uid()
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Users can manage process tracking" ON process_schedule_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM production_lots pl 
            WHERE pl.id = production_lot_id 
            AND pl.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage subtask tracking" ON subtask_schedule_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM process_tracking_timelines ptl
            JOIN production_lots pl ON pl.id = ptl.production_lot_id
            WHERE ptl.id = timeline_id 
            AND pl.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage bom tracking" ON bom_item_schedule_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM process_tracking_timelines ptl
            JOIN production_lots pl ON pl.id = ptl.production_lot_id
            WHERE ptl.id = timeline_id 
            AND pl.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view tracking logs" ON tracking_updates_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM process_tracking_timelines ptl
            JOIN production_lots pl ON pl.id = ptl.production_lot_id
            WHERE ptl.id = timeline_id 
            AND pl.created_by = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_process_tracking_timelines_updated_at
    BEFORE UPDATE ON process_tracking_timelines
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();

CREATE TRIGGER update_process_schedule_tracking_updated_at
    BEFORE UPDATE ON process_schedule_tracking
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();

CREATE TRIGGER update_subtask_schedule_tracking_updated_at
    BEFORE UPDATE ON subtask_schedule_tracking
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();

CREATE TRIGGER update_bom_item_schedule_tracking_updated_at
    BEFORE UPDATE ON bom_item_schedule_tracking
    FOR EACH ROW EXECUTE FUNCTION update_tracking_updated_at();