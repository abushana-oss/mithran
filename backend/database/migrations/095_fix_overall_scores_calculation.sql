-- Fix Overall Scores Calculation Function
-- The current function returns JSON which might not be parsed correctly by the backend

-- Drop the existing function
DROP FUNCTION IF EXISTS get_vendor_rating_overall_scores(UUID, UUID);

-- Create a new function that returns a table instead of JSON
CREATE OR REPLACE FUNCTION get_vendor_rating_overall_scores(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
)
RETURNS TABLE (
    sectionWiseCapability DECIMAL(5,2),
    riskMitigation DECIMAL(5,2), 
    totalMinorNC INTEGER,
    totalMajorNC INTEGER,
    totalRecords INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(COALESCE(AVG(section_wise_capability_percent), 0), 2) as section_wise_capability,
        ROUND(COALESCE(AVG(risk_mitigation_percent), 0), 2) as risk_mitigation,
        COALESCE(SUM(minor_nc), 0)::INTEGER as total_minor_nc,
        COALESCE(SUM(major_nc), 0)::INTEGER as total_major_nc,
        COUNT(*)::INTEGER as total_records
    FROM vendor_rating_matrix
    WHERE nomination_evaluation_id = p_nomination_evaluation_id 
    AND vendor_id = p_vendor_id
    AND section_wise_capability_percent IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_vendor_rating_overall_scores TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_vendor_rating_overall_scores IS 'Calculate overall vendor rating scores - returns table instead of JSON for better backend compatibility';