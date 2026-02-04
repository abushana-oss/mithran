-- =====================================================================================
-- Simplified Vendor Rating Matrix System - No Mock Data
-- =====================================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.vendor_rating_matrix CASCADE;

-- Create simplified vendor rating matrix table
CREATE TABLE IF NOT EXISTS public.vendor_rating_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    s_no INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL,
    assessment_aspects VARCHAR(200) NOT NULL,
    section_wise_capability_percent DECIMAL(5,2) DEFAULT 0.00,
    risk_mitigation_percent DECIMAL(5,2) DEFAULT 0.00,
    minor_nc INTEGER DEFAULT 0,
    major_nc INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_vendor_rating_nomination 
        FOREIGN KEY (nomination_evaluation_id) 
        REFERENCES supplier_nomination_evaluations(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_vendor_rating_vendor 
        FOREIGN KEY (vendor_id) 
        REFERENCES vendors(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT uq_vendor_rating_criteria 
        UNIQUE (nomination_evaluation_id, vendor_id, s_no)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_rating_nomination_vendor 
    ON public.vendor_rating_matrix (nomination_evaluation_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_rating_category 
    ON public.vendor_rating_matrix (category);
CREATE INDEX IF NOT EXISTS idx_vendor_rating_sort_order 
    ON public.vendor_rating_matrix (sort_order, s_no);

-- Enable RLS
ALTER TABLE public.vendor_rating_matrix ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Users can access vendor ratings for their nominations" 
    ON public.vendor_rating_matrix
    FOR ALL 
    USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations 
            WHERE user_id = auth.uid()
        )
    );

-- Function to initialize empty vendor rating criteria structure
CREATE OR REPLACE FUNCTION initialize_vendor_rating_matrix(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Check if criteria already exist
    IF EXISTS (
        SELECT 1 FROM vendor_rating_matrix 
        WHERE nomination_evaluation_id = p_nomination_evaluation_id 
        AND vendor_id = p_vendor_id
    ) THEN
        RETURN;
    END IF;
    
    -- Insert empty rating criteria structure for user to fill
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
    -- Quality category
    (p_nomination_evaluation_id, p_vendor_id, 1, 'Quality', 'Manufacturing Capability', 0.00, 0.00, 0, 0, 1),
    (p_nomination_evaluation_id, p_vendor_id, 2, 'Quality', 'Problem Solving Capability', 0.00, 0.00, 0, 0, 2),
    (p_nomination_evaluation_id, p_vendor_id, 3, 'Quality', 'Quality Control Capability', 0.00, 0.00, 0, 0, 3),
    (p_nomination_evaluation_id, p_vendor_id, 4, 'Quality', 'Prevention Capability', 0.00, 0.00, 0, 0, 4),
    
    -- Cost category
    (p_nomination_evaluation_id, p_vendor_id, 5, 'Cost', 'Cost', 0.00, 0.00, 0, 0, 5),
    
    -- Logistics category
    (p_nomination_evaluation_id, p_vendor_id, 6, 'Logistics', 'Delivery Performance', 0.00, 0.00, 0, 0, 6),
    (p_nomination_evaluation_id, p_vendor_id, 7, 'Logistics', 'Customer Supplier Management', 0.00, 0.00, 0, 0, 7),
    
    -- Development category
    (p_nomination_evaluation_id, p_vendor_id, 8, 'Development', 'Design & Development', 0.00, 0.00, 0, 0, 8),
    
    -- Management category
    (p_nomination_evaluation_id, p_vendor_id, 9, 'Management', 'Strategy', 0.00, 0.00, 0, 0, 9),
    (p_nomination_evaluation_id, p_vendor_id, 10, 'Management', 'Management Culture', 0.00, 0.00, 0, 0, 10),
    (p_nomination_evaluation_id, p_vendor_id, 11, 'Management', 'TQM culture focus', 0.00, 0.00, 0, 0, 11),
    (p_nomination_evaluation_id, p_vendor_id, 12, 'Management', 'Legal & statutory Compliances', 0.00, 0.00, 0, 0, 12),
    
    -- Core Process category
    (p_nomination_evaluation_id, p_vendor_id, 13, 'Core Process', 'Commodity', 0.00, 0.00, 0, 0, 13);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate overall scores
CREATE OR REPLACE FUNCTION get_vendor_rating_overall_scores(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'sectionWiseCapability', ROUND(AVG(section_wise_capability_percent), 1),
        'riskMitigation', ROUND(AVG(risk_mitigation_percent), 1),
        'totalMinorNC', SUM(minor_nc),
        'totalMajorNC', SUM(major_nc),
        'totalRecords', COUNT(*)
    ) INTO result
    FROM vendor_rating_matrix
    WHERE nomination_evaluation_id = p_nomination_evaluation_id 
    AND vendor_id = p_vendor_id;
    
    RETURN COALESCE(result, '{"sectionWiseCapability": 0, "riskMitigation": 0, "totalMinorNC": 0, "totalMajorNC": 0, "totalRecords": 0}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_vendor_rating_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_rating_timestamp
    BEFORE UPDATE ON vendor_rating_matrix
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_rating_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_rating_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_vendor_rating_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_rating_overall_scores TO authenticated;

-- Add comments
COMMENT ON TABLE public.vendor_rating_matrix IS 'Simplified vendor rating matrix - users input their own values';
COMMENT ON FUNCTION initialize_vendor_rating_matrix IS 'Initializes empty rating criteria structure for user input';
COMMENT ON FUNCTION get_vendor_rating_overall_scores IS 'Calculates overall averages from user-entered data';