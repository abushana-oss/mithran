-- Supplier Nomination Evaluation System
-- Comprehensive supplier evaluation and nomination for OEMs and manufacturers
-- Using different table names to avoid conflict with existing supplier_nominations

-- Main nominations table (renamed to avoid conflict)
CREATE TABLE IF NOT EXISTS supplier_nomination_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    evaluation_group_id UUID,
    rfq_tracking_id UUID,
    
    -- Basic info
    nomination_name VARCHAR(255) NOT NULL,
    description TEXT,
    nomination_type VARCHAR(50) NOT NULL CHECK (nomination_type IN ('oem', 'manufacturer', 'hybrid')),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'rejected')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID
);

-- Evaluation criteria configuration
CREATE TABLE IF NOT EXISTS nomination_evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL,
    
    -- Criteria details
    criteria_name VARCHAR(255) NOT NULL,
    criteria_category VARCHAR(100) NOT NULL,
    weight_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    max_score INTEGER NOT NULL DEFAULT 100,
    
    -- Scoring methodology
    scoring_method VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (scoring_method IN ('manual', 'automated', 'hybrid')),
    
    -- Order and grouping
    display_order INTEGER NOT NULL DEFAULT 0,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(nomination_evaluation_id, criteria_name)
);

-- Vendor evaluations for each nomination
CREATE TABLE IF NOT EXISTS vendor_nomination_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    
    -- Vendor classification
    vendor_type VARCHAR(50) NOT NULL DEFAULT 'manufacturer' CHECK (vendor_type IN ('oem', 'manufacturer', 'hybrid')),
    
    -- Overall assessment
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    overall_rank INTEGER,
    recommendation VARCHAR(50) CHECK (recommendation IN ('approved', 'conditional', 'rejected', 'pending')),
    
    -- Risk assessment
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_mitigation_percentage DECIMAL(5,2) DEFAULT 0.00,
    minor_nc_count INTEGER DEFAULT 0,
    major_nc_count INTEGER DEFAULT 0,
    
    -- Capability assessment
    capability_percentage DECIMAL(5,2) DEFAULT 0.00,
    technical_feasibility_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Notes and comments
    evaluation_notes TEXT,
    technical_discussion TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(nomination_evaluation_id, vendor_id)
);

-- Individual criteria scores for each vendor
CREATE TABLE IF NOT EXISTS vendor_evaluation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_nomination_evaluation_id UUID NOT NULL,
    criteria_id UUID NOT NULL,
    
    -- Score details
    score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_possible_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    weighted_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Evidence and justification
    evidence_text TEXT,
    assessor_notes TEXT,
    
    -- Metadata
    assessed_by UUID,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(vendor_nomination_evaluation_id, criteria_id)
);

-- Add foreign key constraints
DO $$ 
BEGIN
    -- Add constraint for nomination_evaluation_criteria
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_criteria_nomination_evaluation' 
        AND table_name = 'nomination_evaluation_criteria'
    ) THEN
        ALTER TABLE nomination_evaluation_criteria 
        ADD CONSTRAINT fk_criteria_nomination_evaluation 
        FOREIGN KEY (nomination_evaluation_id) REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE;
    END IF;

    -- Add constraint for vendor_nomination_evaluations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_vendor_evaluations_nomination' 
        AND table_name = 'vendor_nomination_evaluations'
    ) THEN
        ALTER TABLE vendor_nomination_evaluations 
        ADD CONSTRAINT fk_vendor_evaluations_nomination 
        FOREIGN KEY (nomination_evaluation_id) REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE;
    END IF;

    -- Add constraint for vendor_evaluation_scores (vendor_nomination_evaluation_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_scores_vendor_evaluation' 
        AND table_name = 'vendor_evaluation_scores'
    ) THEN
        ALTER TABLE vendor_evaluation_scores 
        ADD CONSTRAINT fk_scores_vendor_evaluation 
        FOREIGN KEY (vendor_nomination_evaluation_id) REFERENCES vendor_nomination_evaluations(id) ON DELETE CASCADE;
    END IF;

    -- Add constraint for vendor_evaluation_scores (criteria_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_scores_criteria' 
        AND table_name = 'vendor_evaluation_scores'
    ) THEN
        ALTER TABLE vendor_evaluation_scores 
        ADD CONSTRAINT fk_scores_criteria 
        FOREIGN KEY (criteria_id) REFERENCES nomination_evaluation_criteria(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_nomination_evaluations_user_project ON supplier_nomination_evaluations(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_nomination_evaluations_status ON supplier_nomination_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_supplier_nomination_evaluations_type ON supplier_nomination_evaluations(nomination_type);

CREATE INDEX IF NOT EXISTS idx_nomination_evaluation_criteria_nomination ON nomination_evaluation_criteria(nomination_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_nomination_evaluation_criteria_category ON nomination_evaluation_criteria(criteria_category);

CREATE INDEX IF NOT EXISTS idx_vendor_nomination_evaluations_nomination ON vendor_nomination_evaluations(nomination_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_vendor_nomination_evaluations_vendor ON vendor_nomination_evaluations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_nomination_evaluations_score ON vendor_nomination_evaluations(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_evaluation_scores_vendor_eval ON vendor_evaluation_scores(vendor_nomination_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_vendor_evaluation_scores_criteria ON vendor_evaluation_scores(criteria_id);

-- Function to update overall scores when individual scores change
CREATE OR REPLACE FUNCTION update_vendor_nomination_evaluation_score()
RETURNS TRIGGER AS $$
DECLARE
    total_weighted_score DECIMAL(10,2) := 0;
    total_possible_weighted DECIMAL(10,2) := 0;
    final_percentage DECIMAL(5,2);
BEGIN
    -- Calculate weighted average score
    SELECT 
        COALESCE(SUM(vs.weighted_score), 0),
        COALESCE(SUM(nc.weight_percentage), 0)
    INTO total_weighted_score, total_possible_weighted
    FROM vendor_evaluation_scores vs
    JOIN nomination_evaluation_criteria nc ON nc.id = vs.criteria_id
    WHERE vs.vendor_nomination_evaluation_id = COALESCE(NEW.vendor_nomination_evaluation_id, OLD.vendor_nomination_evaluation_id);
    
    -- Calculate final percentage (avoid division by zero)
    IF total_possible_weighted > 0 THEN
        final_percentage := (total_weighted_score / total_possible_weighted) * 100;
    ELSE
        final_percentage := 0;
    END IF;
    
    -- Update the vendor evaluation
    UPDATE vendor_nomination_evaluations 
    SET 
        overall_score = final_percentage,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.vendor_nomination_evaluation_id, OLD.vendor_nomination_evaluation_id);
    
    -- Update rankings within the nomination
    WITH ranked_vendors AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY overall_score DESC) as new_rank
        FROM vendor_nomination_evaluations 
        WHERE nomination_evaluation_id = (
            SELECT nomination_evaluation_id 
            FROM vendor_nomination_evaluations 
            WHERE id = COALESCE(NEW.vendor_nomination_evaluation_id, OLD.vendor_nomination_evaluation_id)
        )
    )
    UPDATE vendor_nomination_evaluations 
    SET overall_rank = ranked_vendors.new_rank
    FROM ranked_vendors 
    WHERE vendor_nomination_evaluations.id = ranked_vendors.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic score updates
DROP TRIGGER IF EXISTS trigger_update_vendor_nomination_scores ON vendor_evaluation_scores;
CREATE TRIGGER trigger_update_vendor_nomination_scores
    AFTER INSERT OR UPDATE OR DELETE ON vendor_evaluation_scores
    FOR EACH ROW EXECUTE FUNCTION update_vendor_nomination_evaluation_score();

-- Function to initialize default criteria for a nomination
CREATE OR REPLACE FUNCTION initialize_nomination_evaluation_criteria(p_nomination_evaluation_id UUID, p_nomination_type VARCHAR(50))
RETURNS VOID AS $$
BEGIN
    -- Default criteria based on nomination type
    IF p_nomination_type = 'oem' THEN
        -- OEM-focused criteria
        INSERT INTO nomination_evaluation_criteria (nomination_evaluation_id, criteria_name, criteria_category, weight_percentage, display_order) VALUES
        (p_nomination_evaluation_id, 'Brand Recognition', 'Quality', 25.00, 1),
        (p_nomination_evaluation_id, 'Technical Innovation', 'Development', 20.00, 2),
        (p_nomination_evaluation_id, 'Cost Competitiveness', 'Cost', 15.00, 3),
        (p_nomination_evaluation_id, 'Global Supply Chain', 'Logistics', 15.00, 4),
        (p_nomination_evaluation_id, 'Quality Certification', 'Quality', 15.00, 5),
        (p_nomination_evaluation_id, 'Strategic Partnership', 'Management', 10.00, 6);
    ELSIF p_nomination_type = 'manufacturer' THEN
        -- Manufacturing-focused criteria
        INSERT INTO nomination_evaluation_criteria (nomination_evaluation_id, criteria_name, criteria_category, weight_percentage, display_order) VALUES
        (p_nomination_evaluation_id, 'Manufacturing Capability', 'Quality', 25.00, 1),
        (p_nomination_evaluation_id, 'Cost Competency', 'Cost', 20.00, 2),
        (p_nomination_evaluation_id, 'Quality Control Systems', 'Quality', 15.00, 3),
        (p_nomination_evaluation_id, 'Production Capacity', 'Core Process', 15.00, 4),
        (p_nomination_evaluation_id, 'Delivery Performance', 'Logistics', 15.00, 5),
        (p_nomination_evaluation_id, 'Process Improvement', 'Management', 10.00, 6);
    ELSE
        -- Hybrid criteria
        INSERT INTO nomination_evaluation_criteria (nomination_evaluation_id, criteria_name, criteria_category, weight_percentage, display_order) VALUES
        (p_nomination_evaluation_id, 'Technical Capability', 'Quality', 20.00, 1),
        (p_nomination_evaluation_id, 'Cost Effectiveness', 'Cost', 20.00, 2),
        (p_nomination_evaluation_id, 'Supply Chain Flexibility', 'Logistics', 15.00, 3),
        (p_nomination_evaluation_id, 'Innovation Capacity', 'Development', 15.00, 4),
        (p_nomination_evaluation_id, 'Quality Management', 'Quality', 15.00, 5),
        (p_nomination_evaluation_id, 'Strategic Alignment', 'Management', 15.00, 6);
    END IF;
END;
$$ LANGUAGE plpgsql;