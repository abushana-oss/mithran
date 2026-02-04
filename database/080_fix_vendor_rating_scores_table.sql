-- =====================================================================================
-- Fix Vendor Rating Scores Table and Functions
-- =====================================================================================

-- Fix foreign key constraint in vendor_rating_overall_scores table
ALTER TABLE public.vendor_rating_overall_scores 
DROP CONSTRAINT IF EXISTS vendor_rating_overall_scores_nomination_evaluation_id_fkey;

ALTER TABLE public.vendor_rating_overall_scores 
ADD CONSTRAINT vendor_rating_overall_scores_nomination_evaluation_id_fkey 
FOREIGN KEY (nomination_evaluation_id) 
REFERENCES supplier_nomination_evaluations (id) 
ON DELETE CASCADE;

-- Update the initialize function to work with the current table structure
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
    
    -- Initialize the overall scores record
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
        0.0,
        0.0,
        0,
        0,
        13,
        NOW()
    )
    ON CONFLICT (nomination_evaluation_id, vendor_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update overall scores
CREATE OR REPLACE FUNCTION calculate_vendor_rating_overall_scores(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_section_capability NUMERIC(5,2) := 0.0;
    v_risk_mitigation NUMERIC(5,2) := 0.0;
    v_minor_nc INTEGER := 0;
    v_major_nc INTEGER := 0;
    v_record_count INTEGER := 0;
    result JSON;
BEGIN
    -- Calculate aggregated scores from the matrix data
    SELECT 
        ROUND(AVG(section_wise_capability_percent), 1),
        ROUND(AVG(risk_mitigation_percent), 1),
        SUM(minor_nc),
        SUM(major_nc),
        COUNT(*)
    INTO 
        v_section_capability,
        v_risk_mitigation,
        v_minor_nc,
        v_major_nc,
        v_record_count
    FROM vendor_rating_matrix
    WHERE nomination_evaluation_id = p_nomination_evaluation_id 
    AND vendor_id = p_vendor_id;
    
    -- Ensure we have valid values
    v_section_capability := COALESCE(v_section_capability, 0.0);
    v_risk_mitigation := COALESCE(v_risk_mitigation, 0.0);
    v_minor_nc := COALESCE(v_minor_nc, 0);
    v_major_nc := COALESCE(v_major_nc, 0);
    v_record_count := COALESCE(v_record_count, 0);
    
    -- Update or insert the overall scores
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
        v_section_capability,
        v_risk_mitigation,
        v_minor_nc,
        v_major_nc,
        v_record_count,
        NOW()
    )
    ON CONFLICT (nomination_evaluation_id, vendor_id) 
    DO UPDATE SET
        section_wise_capability_overall = v_section_capability,
        risk_mitigation_overall = v_risk_mitigation,
        total_minor_nc = v_minor_nc,
        total_major_nc = v_major_nc,
        total_records = v_record_count,
        calculated_at = NOW();
    
    -- Return the calculated scores
    result := json_build_object(
        'sectionWiseCapability', v_section_capability,
        'riskMitigation', v_risk_mitigation,
        'totalMinorNC', v_minor_nc,
        'totalMajorNC', v_major_nc,
        'totalRecords', v_record_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overall scores (replaces the old one)
CREATE OR REPLACE FUNCTION get_vendor_rating_overall_scores(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Try to get from scores table first
    SELECT json_build_object(
        'sectionWiseCapability', section_wise_capability_overall,
        'riskMitigation', risk_mitigation_overall,
        'totalMinorNC', total_minor_nc,
        'totalMajorNC', total_major_nc,
        'totalRecords', total_records
    ) INTO result
    FROM vendor_rating_overall_scores
    WHERE nomination_evaluation_id = p_nomination_evaluation_id 
    AND vendor_id = p_vendor_id;
    
    -- If no record found, calculate and return fresh scores
    IF result IS NULL THEN
        result := calculate_vendor_rating_overall_scores(p_nomination_evaluation_id, p_vendor_id);
    END IF;
    
    RETURN COALESCE(result, '{"sectionWiseCapability": 0, "riskMitigation": 0, "totalMinorNC": 0, "totalMajorNC": 0, "totalRecords": 0}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update overall scores when matrix data changes
CREATE OR REPLACE FUNCTION trigger_update_vendor_rating_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Update overall scores whenever matrix data changes
    PERFORM calculate_vendor_rating_overall_scores(
        COALESCE(NEW.nomination_evaluation_id, OLD.nomination_evaluation_id),
        COALESCE(NEW.vendor_id, OLD.vendor_id)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic score updates
DROP TRIGGER IF EXISTS trigger_auto_update_vendor_rating_scores ON vendor_rating_matrix;
CREATE TRIGGER trigger_auto_update_vendor_rating_scores
    AFTER INSERT OR UPDATE OR DELETE ON vendor_rating_matrix
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_vendor_rating_scores();

-- Enable RLS on scores table (only if not already enabled)
DO $$
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'vendor_rating_overall_scores') THEN
        ALTER TABLE public.vendor_rating_overall_scores ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Policy for scores table (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can access vendor rating scores for their nominations" ON public.vendor_rating_overall_scores;
CREATE POLICY "Users can access vendor rating scores for their nominations" 
    ON public.vendor_rating_overall_scores
    FOR ALL 
    USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_rating_overall_scores TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_vendor_rating_overall_scores TO authenticated;

-- Update the existing function grants
GRANT EXECUTE ON FUNCTION initialize_vendor_rating_matrix TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_rating_overall_scores TO authenticated;

-- Add comments
COMMENT ON TABLE public.vendor_rating_overall_scores IS 'Cached overall scores for vendor rating matrix';
COMMENT ON FUNCTION calculate_vendor_rating_overall_scores IS 'Calculates and updates overall scores in separate table';
COMMENT ON FUNCTION get_vendor_rating_overall_scores IS 'Gets overall scores from cache or calculates fresh';