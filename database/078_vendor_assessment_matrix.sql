-- =====================================================================================
-- Vendor Assessment Matrix System for Supplier Nominations
-- =====================================================================================

-- Create vendor assessment criteria table
CREATE TABLE IF NOT EXISTS public.vendor_assessment_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    assessment_aspects VARCHAR(200) NOT NULL,
    total_score INTEGER NOT NULL DEFAULT 100,
    actual_score INTEGER NOT NULL DEFAULT 0,
    high_threshold INTEGER NOT NULL DEFAULT 70,
    low_threshold INTEGER NOT NULL DEFAULT 50,
    risk_section_total INTEGER NOT NULL DEFAULT 0,
    risk_actual_score INTEGER NOT NULL DEFAULT 0,
    minor_nc INTEGER NOT NULL DEFAULT 0,
    major_nc INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_vendor_assessment_nomination 
        FOREIGN KEY (nomination_evaluation_id) 
        REFERENCES supplier_nomination_evaluations(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_vendor_assessment_vendor 
        FOREIGN KEY (vendor_id) 
        REFERENCES vendors(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate criteria for same vendor in nomination
    CONSTRAINT uq_vendor_assessment_criteria 
        UNIQUE (nomination_evaluation_id, vendor_id, category, assessment_aspects)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_assessment_nomination_vendor 
    ON public.vendor_assessment_criteria (nomination_evaluation_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assessment_category 
    ON public.vendor_assessment_criteria (category);
CREATE INDEX IF NOT EXISTS idx_vendor_assessment_sort_order 
    ON public.vendor_assessment_criteria (sort_order);

-- Add RLS policies for security
ALTER TABLE public.vendor_assessment_criteria ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to access their own data
CREATE POLICY "Users can access vendor assessments for their nominations" 
    ON public.vendor_assessment_criteria
    FOR ALL 
    USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations 
            WHERE user_id = auth.uid()
        )
    );

-- Function to calculate derived fields automatically
CREATE OR REPLACE FUNCTION calculate_vendor_assessment_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate sectionwise capability percentage
    NEW.sectionwise_capability = CASE 
        WHEN NEW.total_score > 0 THEN (NEW.actual_score::DECIMAL / NEW.total_score * 100)
        ELSE 0
    END;
    
    -- Calculate risk mitigation percentage
    NEW.risk_mitigation = CASE 
        WHEN NEW.risk_section_total > 0 THEN (NEW.risk_actual_score::DECIMAL / NEW.risk_section_total * 100)
        ELSE 0
    END;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add calculated fields to the table
ALTER TABLE public.vendor_assessment_criteria 
ADD COLUMN IF NOT EXISTS sectionwise_capability DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS risk_mitigation DECIMAL(5,2) DEFAULT 0.00;

-- Create trigger for automatic calculation
DROP TRIGGER IF EXISTS trigger_calculate_vendor_assessment_metrics 
    ON public.vendor_assessment_criteria;
CREATE TRIGGER trigger_calculate_vendor_assessment_metrics
    BEFORE INSERT OR UPDATE ON public.vendor_assessment_criteria
    FOR EACH ROW
    EXECUTE FUNCTION calculate_vendor_assessment_metrics();

-- Function to initialize default vendor assessment criteria
CREATE OR REPLACE FUNCTION initialize_vendor_assessment_criteria(
    p_nomination_id UUID,
    p_vendor_id UUID
)
RETURNS VOID AS $$
DECLARE
    default_criteria RECORD;
BEGIN
    -- Check if criteria already exist
    IF EXISTS (
        SELECT 1 FROM vendor_assessment_criteria 
        WHERE nomination_evaluation_id = p_nomination_id 
        AND vendor_id = p_vendor_id
    ) THEN
        RETURN;
    END IF;
    
    -- Insert default criteria
    INSERT INTO vendor_assessment_criteria (
        nomination_evaluation_id,
        vendor_id,
        category,
        assessment_aspects,
        total_score,
        actual_score,
        high_threshold,
        low_threshold,
        risk_section_total,
        risk_actual_score,
        minor_nc,
        major_nc,
        sort_order
    ) VALUES
    (p_nomination_id, p_vendor_id, 'Quality', 'Manufacturing Capability', 100, 0, 70, 50, 0, 0, 0, 0, 1),
    (p_nomination_id, p_vendor_id, 'Quality', 'Quality Control Systems', 100, 0, 70, 50, 0, 0, 0, 0, 2),
    (p_nomination_id, p_vendor_id, 'Cost', 'Cost Competency', 100, 0, 70, 50, 0, 0, 0, 0, 3),
    (p_nomination_id, p_vendor_id, 'Logistics', 'Delivery Performance', 100, 0, 70, 50, 0, 0, 0, 0, 4),
    (p_nomination_id, p_vendor_id, 'Development', 'Design & Development Capability', 100, 0, 70, 50, 0, 0, 0, 0, 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vendor assessment metrics
CREATE OR REPLACE FUNCTION get_vendor_assessment_metrics(
    p_nomination_id UUID,
    p_vendor_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'overallScore1', COALESCE(
            (SUM(actual_score)::DECIMAL / NULLIF(SUM(total_score), 0) * 100), 0
        ),
        'overallScore2', COALESCE(
            (SUM(risk_actual_score)::DECIMAL / NULLIF(SUM(risk_section_total), 0) * 100), 0
        ),
        'totalActual', COALESCE(SUM(actual_score), 0),
        'totalPossible', COALESCE(SUM(total_score), 0),
        'totalMinorNC', COALESCE(SUM(minor_nc), 0),
        'totalMajorNC', COALESCE(SUM(major_nc), 0),
        'ratingStatus', 
        CASE 
            WHEN COALESCE((SUM(actual_score)::DECIMAL / NULLIF(SUM(total_score), 0) * 100), 0) >= 75 THEN 'excellent'
            WHEN COALESCE((SUM(actual_score)::DECIMAL / NULLIF(SUM(total_score), 0) * 100), 0) >= 60 THEN 'good'
            ELSE 'needs_improvement'
        END
    ) INTO result
    FROM vendor_assessment_criteria
    WHERE nomination_evaluation_id = p_nomination_id 
    AND vendor_id = p_vendor_id;
    
    RETURN COALESCE(result, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_assessment_criteria TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_vendor_assessment_criteria TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_assessment_metrics TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.vendor_assessment_criteria IS 'Stores vendor assessment matrix data for supplier nomination evaluations';
COMMENT ON FUNCTION initialize_vendor_assessment_criteria IS 'Initializes default assessment criteria for a vendor in a nomination';
COMMENT ON FUNCTION get_vendor_assessment_metrics IS 'Calculates and returns assessment metrics for a vendor in a nomination';