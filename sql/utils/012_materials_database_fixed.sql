-- ============================================================================
-- MIGRATION 012: Materials Database (Raw Materials for Production) - FIXED
-- ============================================================================
-- This is a safe version that can be re-run without errors
-- ============================================================================

-- ============================================================================
-- TABLE: materials
-- ============================================================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Material Classification
    material_group VARCHAR(100) NOT NULL,
    material VARCHAR(255) NOT NULL,
    material_abbreviation VARCHAR(50),
    material_grade VARCHAR(255),
    stock_form VARCHAR(100),
    material_state VARCHAR(100),

    -- Application and Properties
    application TEXT,
    regrinding BOOLEAN DEFAULT false,
    regrinding_percentage DECIMAL(5, 2),

    -- Process Parameters
    clamping_pressure_mpa DECIMAL(10, 2),
    eject_deflection_temp_celsius DECIMAL(10, 2),
    melting_temp_celsius DECIMAL(10, 2),
    mold_temp_celsius DECIMAL(10, 2),

    -- Material Properties
    density_kg_per_m3 DECIMAL(10, 2),
    specific_heat_j_per_g_celsius DECIMAL(10, 4),
    thermal_conductivity_w_per_m_celsius DECIMAL(10, 4),

    -- Cost Data (Quarterly pricing in INR)
    location VARCHAR(100),
    year INTEGER,
    cost_q1 DECIMAL(15, 2),
    cost_q2 DECIMAL(15, 2),
    cost_q3 DECIMAL(15, 2),
    cost_q4 DECIMAL(15, 2),

    -- Ownership and timestamps
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for materials
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_group ON materials(material_group);
CREATE INDEX IF NOT EXISTS idx_materials_abbreviation ON materials(material_abbreviation);
CREATE INDEX IF NOT EXISTS idx_materials_grade ON materials(material_grade);
CREATE INDEX IF NOT EXISTS idx_materials_location ON materials(location);
CREATE INDEX IF NOT EXISTS idx_materials_year ON materials(year);

-- ============================================================================
-- ADD MATERIAL LINK TO BOM ITEMS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bom_items' AND column_name = 'material_id'
    ) THEN
        ALTER TABLE bom_items
        ADD COLUMN material_id UUID REFERENCES materials(id) ON DELETE SET NULL;

        CREATE INDEX IF NOT EXISTS idx_bom_items_material_id ON bom_items(material_id);
    END IF;
END$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on materials table
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their materials" ON materials;
CREATE POLICY "Users can manage their materials"
    ON materials FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS - Drop and recreate to avoid conflicts
-- ============================================================================

DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Get Current Quarter Cost
-- ============================================================================
CREATE OR REPLACE FUNCTION get_material_current_cost(material_row materials)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    current_quarter INTEGER;
BEGIN
    -- Determine current quarter (1-4)
    current_quarter := EXTRACT(QUARTER FROM CURRENT_DATE);

    -- Return cost for current quarter
    CASE current_quarter
        WHEN 1 THEN RETURN material_row.cost_q1;
        WHEN 2 THEN RETURN material_row.cost_q2;
        WHEN 3 THEN RETURN material_row.cost_q3;
        WHEN 4 THEN RETURN material_row.cost_q4;
        ELSE RETURN material_row.cost_q1; -- Default to Q1
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- END OF MIGRATION 012 (FIXED)
-- ============================================================================
