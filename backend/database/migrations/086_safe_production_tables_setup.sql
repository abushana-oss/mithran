-- Migration 086: Safe setup of production tables with proper constraint handling

-- 1. Create production_lots table if it doesn't exist
CREATE TABLE IF NOT EXISTS production_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_number VARCHAR(255) UNIQUE NOT NULL,
    lot_type VARCHAR(50) DEFAULT 'standard' CHECK (lot_type IN ('prototype', 'standard', 'custom')),
    bom_id UUID NOT NULL,
    project_id UUID NOT NULL,
    production_quantity INTEGER NOT NULL CHECK (production_quantity > 0),
    status VARCHAR(50) DEFAULT 'planned' CHECK (
        status IN ('planned', 'materials_ordered', 'in_production', 'completed', 'cancelled', 'on_hold')
    ),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    total_estimated_cost DECIMAL(15, 2) DEFAULT 0,
    total_actual_cost DECIMAL(15, 2) DEFAULT 0,
    total_material_cost DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL
);

-- 2. Create lot_vendor_assignments table if it doesn't exist with all required columns
CREATE TABLE IF NOT EXISTS lot_vendor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL,
    bom_item_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    required_quantity DECIMAL(12, 3) NOT NULL CHECK (required_quantity > 0),
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) DEFAULT 0,
    delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (
        delivery_status IN ('pending', 'ordered', 'confirmed', 'shipped', 'delivered', 'delayed')
    ),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    quality_status VARCHAR(50) DEFAULT 'pending' CHECK (
        quality_status IN ('pending', 'inspected', 'approved', 'rejected', 'rework_required')
    ),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(production_lot_id, bom_item_id)
);

-- 3. Create production_processes table if it doesn't exist
CREATE TABLE IF NOT EXISTS production_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_lot_id UUID NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    process_sequence INTEGER NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')
    ),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    completion_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    estimated_hours DECIMAL(8, 2) DEFAULT 0,
    actual_hours DECIMAL(8, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add foreign key constraints safely (only if they don't already exist)
DO $$
BEGIN
    -- Add foreign key for lot_vendor_assignments -> production_lots
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lot_vendor_assignments_production_lot_id'
    ) THEN
        ALTER TABLE lot_vendor_assignments 
        ADD CONSTRAINT fk_lot_vendor_assignments_production_lot_id 
        FOREIGN KEY (production_lot_id) REFERENCES production_lots(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for lot_vendor_assignments.production_lot_id';
    END IF;

    -- Add foreign key for production_processes -> production_lots
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_production_processes_production_lot_id'
    ) THEN
        ALTER TABLE production_processes 
        ADD CONSTRAINT fk_production_processes_production_lot_id 
        FOREIGN KEY (production_lot_id) REFERENCES production_lots(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for production_processes.production_lot_id';
    END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lot_vendor_assignments_production_lot_id ON lot_vendor_assignments(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_vendor_assignments_vendor_id ON lot_vendor_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_production_processes_production_lot_id ON production_processes(production_lot_id);
CREATE INDEX IF NOT EXISTS idx_production_lots_project_id ON production_lots(project_id);
CREATE INDEX IF NOT EXISTS idx_production_lots_status ON production_lots(status);

-- 6. Verify the setup
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('production_lots', 'lot_vendor_assignments', 'production_processes')
AND column_name IN ('expected_delivery_date', 'actual_delivery_date', 'production_lot_id')
ORDER BY table_name, column_name;