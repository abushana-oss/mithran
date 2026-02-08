-- ============================================================================
-- Create Sub-Task with BOM Parts Integration
-- Production-ready SQL for Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROCESS SUB-TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS process_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_process_id UUID NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    task_sequence INTEGER NOT NULL DEFAULT 1,
    
    -- Date-based scheduling
    planned_start_date TIMESTAMPTZ,
    planned_end_date TIMESTAMPTZ,
    actual_start_date TIMESTAMPTZ,
    actual_end_date TIMESTAMPTZ,
    
    -- Assignment
    assigned_operator VARCHAR(255),
    operator_name VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    
    -- Metadata
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_process_subtasks_production_process 
        FOREIGN KEY (production_process_id) REFERENCES production_processes(id) ON DELETE CASCADE,
    CONSTRAINT fk_process_subtasks_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Add missing columns if table already exists
DO $$
BEGIN
    -- Add planned_start_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'process_subtasks' AND column_name = 'planned_start_date') THEN
        ALTER TABLE process_subtasks ADD COLUMN planned_start_date TIMESTAMPTZ;
    END IF;
    
    -- Add planned_end_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'process_subtasks' AND column_name = 'planned_end_date') THEN
        ALTER TABLE process_subtasks ADD COLUMN planned_end_date TIMESTAMPTZ;
    END IF;
    
    -- Add actual_start_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'process_subtasks' AND column_name = 'actual_start_date') THEN
        ALTER TABLE process_subtasks ADD COLUMN actual_start_date TIMESTAMPTZ;
    END IF;
    
    -- Add actual_end_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'process_subtasks' AND column_name = 'actual_end_date') THEN
        ALTER TABLE process_subtasks ADD COLUMN actual_end_date TIMESTAMPTZ;
    END IF;
    
    -- Add operator_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'process_subtasks' AND column_name = 'operator_name') THEN
        ALTER TABLE process_subtasks ADD COLUMN operator_name VARCHAR(255);
    END IF;
    
    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'process_subtasks' AND column_name = 'notes') THEN
        ALTER TABLE process_subtasks ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_process_subtasks_production_process_id ON process_subtasks(production_process_id);
CREATE INDEX IF NOT EXISTS idx_process_subtasks_status ON process_subtasks(status);

-- ============================================================================
-- 2. SUBTASK BOM REQUIREMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subtask_bom_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subtask_id UUID NOT NULL,
    bom_item_id UUID NOT NULL,
    required_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pcs',
    requirement_status VARCHAR(50) DEFAULT 'PENDING' CHECK (
        requirement_status IN ('PENDING', 'AVAILABLE', 'PARTIAL', 'SHORTAGE', 'CONSUMED')
    ),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_subtask_bom_requirements_subtask 
        FOREIGN KEY (subtask_id) REFERENCES process_subtasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_subtask_bom_requirements_bom_item 
        FOREIGN KEY (bom_item_id) REFERENCES bom_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_subtask_bom_requirements_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id),
    
    -- Prevent duplicates
    CONSTRAINT uk_subtask_bom_requirements_unique 
        UNIQUE (subtask_id, bom_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subtask_bom_requirements_subtask_id ON subtask_bom_requirements(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_bom_requirements_bom_item_id ON subtask_bom_requirements(bom_item_id);

-- ============================================================================
-- 3. UPDATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_subtask_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_process_subtasks_updated_at ON process_subtasks;
CREATE TRIGGER tr_process_subtasks_updated_at
    BEFORE UPDATE ON process_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_subtask_updated_at();

-- ============================================================================
-- 4. MAIN CREATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION create_subtask_with_bom_parts(
    p_production_process_id UUID,
    p_task_name VARCHAR(255),
    p_created_by UUID,
    p_description TEXT DEFAULT NULL,
    p_assigned_operator VARCHAR(255) DEFAULT NULL,
    p_planned_start_date TIMESTAMPTZ DEFAULT NULL,
    p_planned_end_date TIMESTAMPTZ DEFAULT NULL,
    p_status VARCHAR(50) DEFAULT 'PENDING',
    p_bom_parts JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(
    subtask_id UUID,
    success BOOLEAN,
    message TEXT,
    bom_requirements_created INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_subtask_id UUID;
    v_sequence_number INTEGER;
    v_bom_item JSONB;
    v_bom_requirements_count INTEGER := 0;
BEGIN
    -- Calculate next sequence number
    SELECT COALESCE(MAX(task_sequence), 0) + 1
    INTO v_sequence_number
    FROM process_subtasks
    WHERE production_process_id = p_production_process_id;
    
    -- Create the subtask
    INSERT INTO process_subtasks (
        production_process_id,
        task_name,
        description,
        task_sequence,
        planned_start_date,
        planned_end_date,
        assigned_operator,
        operator_name,
        status,
        created_by
    ) VALUES (
        p_production_process_id,
        p_task_name,
        p_description,
        v_sequence_number,
        p_planned_start_date,
        p_planned_end_date,
        p_assigned_operator,
        p_assigned_operator,
        p_status,
        p_created_by
    )
    RETURNING id INTO v_subtask_id;
    
    -- Process BOM parts requirements
    FOR v_bom_item IN SELECT * FROM jsonb_array_elements(p_bom_parts)
    LOOP
        -- Insert BOM requirement if quantity > 0
        IF (v_bom_item->>'required_quantity')::DECIMAL > 0 THEN
            INSERT INTO subtask_bom_requirements (
                subtask_id,
                bom_item_id,
                required_quantity,
                unit,
                requirement_status,
                created_by
            ) VALUES (
                v_subtask_id,
                (v_bom_item->>'bom_item_id')::UUID,
                (v_bom_item->>'required_quantity')::DECIMAL,
                COALESCE(v_bom_item->>'unit', 'pcs'),
                'PENDING',
                p_created_by
            );
            
            v_bom_requirements_count := v_bom_requirements_count + 1;
        END IF;
    END LOOP;
    
    -- Return result
    RETURN QUERY SELECT 
        v_subtask_id,
        TRUE,
        'Sub-task created successfully with ' || v_bom_requirements_count || ' BOM requirements',
        v_bom_requirements_count;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        NULL::UUID,
        FALSE,
        'Error: ' || SQLERRM,
        0;
END;
$$;

-- ============================================================================
-- 5. GET SUBTASK WITH BOM DATA
-- ============================================================================
CREATE OR REPLACE VIEW v_subtask_details AS
SELECT 
    st.id,
    st.production_process_id,
    st.task_name,
    st.description,
    st.task_sequence,
    st.planned_start_date,
    st.planned_end_date,
    st.actual_start_date,
    st.actual_end_date,
    st.assigned_operator,
    st.operator_name,
    st.status,
    st.created_at,
    st.updated_at,
    
    -- BOM requirements as JSON
    COALESCE(
        (
            SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id', sbr.id,
                    'bom_item_id', sbr.bom_item_id,
                    'part_number', bi.part_number,
                    'part_name', COALESCE(bi.name, bi.part_number),
                    'description', COALESCE(bi.description, ''),
                    'required_quantity', sbr.required_quantity,
                    'unit', sbr.unit,
                    'status', sbr.requirement_status
                )
            )
            FROM subtask_bom_requirements sbr
            JOIN bom_items bi ON sbr.bom_item_id = bi.id
            WHERE sbr.subtask_id = st.id
        ),
        '[]'::JSONB
    ) as bom_requirements
    
FROM process_subtasks st
ORDER BY st.task_sequence, st.created_at;

-- ============================================================================
-- 6. API FUNCTIONS
-- ============================================================================

-- Get subtasks for a production process
CREATE OR REPLACE FUNCTION get_process_subtasks(p_production_process_id UUID)
RETURNS TABLE(subtasks_data JSONB)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT JSONB_AGG(ROW_TO_JSON(subtask_details))
    FROM v_subtask_details subtask_details
    WHERE production_process_id = p_production_process_id
    ORDER BY task_sequence, created_at;
END;
$$;

-- Get single subtask
CREATE OR REPLACE FUNCTION get_subtask_by_id(p_subtask_id UUID)
RETURNS TABLE(subtask_data JSONB)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT ROW_TO_JSON(subtask_details)::JSONB
    FROM v_subtask_details subtask_details
    WHERE id = p_subtask_id;
END;
$$;

-- ============================================================================
-- 7. SECURITY
-- ============================================================================
ALTER TABLE process_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtask_bom_requirements ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can manage their subtasks" ON process_subtasks
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage their BOM requirements" ON subtask_bom_requirements
    FOR ALL USING (created_by = auth.uid());

-- ============================================================================
-- COMPLETION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Sub-task with BOM parts database setup completed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE 'SELECT * FROM create_subtask_with_bom_parts(';
    RAISE NOTICE '  production_process_id,';
    RAISE NOTICE '  ''Task Name'',';
    RAISE NOTICE '  user_id,';
    RAISE NOTICE '  ''Description'',';
    RAISE NOTICE '  ''Operator Name'',';
    RAISE NOTICE '  ''2024-02-08 09:00:00+00'',';
    RAISE NOTICE '  ''2024-02-08 17:00:00+00'',';
    RAISE NOTICE '  ''PENDING'',';
    RAISE NOTICE '  ''[{"bom_item_id":"uuid","required_quantity":2,"unit":"pcs"}]''::JSONB';
    RAISE NOTICE ');';
END $$;