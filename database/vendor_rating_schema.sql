-- Vendor Rating Matrix Database Schema
-- This schema stores vendor ratings and calculates overall scores

-- Clean up existing objects (but keep shared functions)
DROP FUNCTION IF EXISTS initialize_vendor_rating_matrix(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_vendor_rating_overall_scores(UUID, UUID);
DROP FUNCTION IF EXISTS trigger_calculate_overall_scores();

-- Create vendor_rating_matrix table
CREATE TABLE IF NOT EXISTS vendor_rating_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    s_no INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    assessment_aspects TEXT NOT NULL,
    section_wise_capability_percent DECIMAL(5,2) DEFAULT 0.0 CHECK (section_wise_capability_percent >= 0 AND section_wise_capability_percent <= 100),
    risk_mitigation_percent DECIMAL(5,2) DEFAULT 0.0 CHECK (risk_mitigation_percent >= 0 AND risk_mitigation_percent <= 100),
    minor_nc INTEGER DEFAULT 0 CHECK (minor_nc >= 0),
    major_nc INTEGER DEFAULT 0 CHECK (major_nc >= 0),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(nomination_evaluation_id, vendor_id, s_no),
    
    -- Foreign key references (adjust table names as needed)
    FOREIGN KEY (nomination_evaluation_id) REFERENCES supplier_nominations(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Create vendor_rating_overall_scores table for calculated results
CREATE TABLE IF NOT EXISTS vendor_rating_overall_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    section_wise_capability_overall DECIMAL(5,2) DEFAULT 0.0,
    risk_mitigation_overall DECIMAL(5,2) DEFAULT 0.0,
    total_minor_nc INTEGER DEFAULT 0,
    total_major_nc INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(nomination_evaluation_id, vendor_id),
    
    -- Foreign key references
    FOREIGN KEY (nomination_evaluation_id) REFERENCES supplier_nominations(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_rating_matrix_nomination_vendor 
    ON vendor_rating_matrix(nomination_evaluation_id, vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_rating_matrix_category 
    ON vendor_rating_matrix(category);

CREATE INDEX IF NOT EXISTS idx_vendor_rating_overall_scores_nomination_vendor 
    ON vendor_rating_overall_scores(nomination_evaluation_id, vendor_id);

-- Function to calculate overall scores
CREATE OR REPLACE FUNCTION calculate_vendor_rating_overall_scores(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
) RETURNS VOID AS $$
DECLARE
    v_section_avg DECIMAL(5,2);
    v_risk_avg DECIMAL(5,2);
    v_total_minor INTEGER;
    v_total_major INTEGER;
    v_total_records INTEGER;
BEGIN
    -- Calculate averages and totals
    SELECT 
        COALESCE(AVG(section_wise_capability_percent), 0),
        COALESCE(AVG(risk_mitigation_percent), 0),
        COALESCE(SUM(minor_nc), 0),
        COALESCE(SUM(major_nc), 0),
        COUNT(*)
    INTO 
        v_section_avg,
        v_risk_avg,
        v_total_minor,
        v_total_major,
        v_total_records
    FROM vendor_rating_matrix
    WHERE nomination_evaluation_id = p_nomination_evaluation_id
      AND vendor_id = p_vendor_id;

    -- Insert or update overall scores
    INSERT INTO vendor_rating_overall_scores (
        nomination_evaluation_id,
        vendor_id,
        section_wise_capability_overall,
        risk_mitigation_overall,
        total_minor_nc,
        total_major_nc,
        total_records,
        calculated_at
    ) VALUES (
        p_nomination_evaluation_id,
        p_vendor_id,
        v_section_avg,
        v_risk_avg,
        v_total_minor,
        v_total_major,
        v_total_records,
        NOW()
    )
    ON CONFLICT (nomination_evaluation_id, vendor_id)
    DO UPDATE SET
        section_wise_capability_overall = v_section_avg,
        risk_mitigation_overall = v_risk_avg,
        total_minor_nc = v_total_minor,
        total_major_nc = v_total_major,
        total_records = v_total_records,
        calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate overall scores when matrix data changes
CREATE OR REPLACE FUNCTION trigger_calculate_overall_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate for the affected nomination/vendor combination
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_vendor_rating_overall_scores(OLD.nomination_evaluation_id, OLD.vendor_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_vendor_rating_overall_scores(NEW.nomination_evaluation_id, NEW.vendor_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_vendor_rating_matrix_calculate_scores ON vendor_rating_matrix;
CREATE TRIGGER trg_vendor_rating_matrix_calculate_scores
    AFTER INSERT OR UPDATE OR DELETE ON vendor_rating_matrix
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_overall_scores();

-- Drop existing function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS initialize_vendor_rating_matrix(UUID, UUID);

-- Function to initialize default rating matrix for a vendor/nomination
CREATE OR REPLACE FUNCTION initialize_vendor_rating_matrix(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Insert default rating criteria
    INSERT INTO vendor_rating_matrix (
        nomination_evaluation_id,
        vendor_id,
        s_no,
        category,
        assessment_aspects,
        section_wise_capability_percent,
        risk_mitigation_percent,
        minor_nc,
        major_nc,
        sort_order
    ) VALUES 
        (p_nomination_evaluation_id, p_vendor_id, 1, 'Quality', 'Manufacturing Capability', 0, 0, 0, 0, 1),
        (p_nomination_evaluation_id, p_vendor_id, 2, 'Quality', 'Problem Solving Capability', 0, 0, 0, 0, 2),
        (p_nomination_evaluation_id, p_vendor_id, 3, 'Quality', 'Quality Control Capability', 0, 0, 0, 0, 3),
        (p_nomination_evaluation_id, p_vendor_id, 4, 'Quality', 'Prevention Capability', 0, 0, 0, 0, 4),
        (p_nomination_evaluation_id, p_vendor_id, 5, 'Cost', 'Cost', 0, 0, 0, 0, 5),
        (p_nomination_evaluation_id, p_vendor_id, 6, 'Logistics', 'Delivery Performance', 0, 0, 0, 0, 6),
        (p_nomination_evaluation_id, p_vendor_id, 7, 'Logistics', 'Customer Supplier Management', 0, 0, 0, 0, 7),
        (p_nomination_evaluation_id, p_vendor_id, 8, 'Development', 'Design & Development', 0, 0, 0, 0, 8),
        (p_nomination_evaluation_id, p_vendor_id, 9, 'Management', 'Strategy', 0, 0, 0, 0, 9),
        (p_nomination_evaluation_id, p_vendor_id, 10, 'Management', 'Management Culture', 0, 0, 0, 0, 10),
        (p_nomination_evaluation_id, p_vendor_id, 11, 'Management', 'TQM culture focus', 0, 0, 0, 0, 11),
        (p_nomination_evaluation_id, p_vendor_id, 12, 'Management', 'Legal & statutory Compliances', 0, 0, 0, 0, 12),
        (p_nomination_evaluation_id, p_vendor_id, 13, 'Core Process', 'Commodity', 0, 0, 0, 0, 13)
    ON CONFLICT (nomination_evaluation_id, vendor_id, s_no) DO NOTHING;
    
    -- Calculate initial overall scores
    PERFORM calculate_vendor_rating_overall_scores(p_nomination_evaluation_id, p_vendor_id);
END;
$$ LANGUAGE plpgsql;

-- Note: update_updated_at_column() function already exists and is shared across tables

-- Create updated_at triggers
DROP TRIGGER IF EXISTS trg_vendor_rating_matrix_updated_at ON vendor_rating_matrix;
CREATE TRIGGER trg_vendor_rating_matrix_updated_at
    BEFORE UPDATE ON vendor_rating_matrix
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample queries for testing

-- Initialize rating matrix for a vendor/nomination
-- SELECT initialize_vendor_rating_matrix('34ba91f4-e774-4817-9f8d-7a6c289ecfa2', '8d298b8e-c30a-4082-a449-e17bc4abe5a1');

-- Get rating matrix data
-- SELECT * FROM vendor_rating_matrix 
-- WHERE nomination_evaluation_id = '34ba91f4-e774-4817-9f8d-7a6c289ecfa2' 
--   AND vendor_id = '8d298b8e-c30a-4082-a449-e17bc4abe5a1'
-- ORDER BY sort_order;

-- Get overall scores
-- SELECT * FROM vendor_rating_overall_scores
-- WHERE nomination_evaluation_id = '34ba91f4-e774-4817-9f8d-7a6c289ecfa2' 
--   AND vendor_id = '8d298b8e-c30a-4082-a449-e17bc4abe5a1';

-- Update a rating and see auto-calculation
-- UPDATE vendor_rating_matrix 
-- SET section_wise_capability_percent = 85.5, risk_mitigation_percent = 90.0
-- WHERE nomination_evaluation_id = '34ba91f4-e774-4817-9f8d-7a6c289ecfa2' 
--   AND vendor_id = '8d298b8e-c30a-4082-a449-e17bc4abe5a1'
--   AND s_no = 1;