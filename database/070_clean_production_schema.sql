-- Production supplier evaluation schema
-- Clean real-time evaluation system

-- 1. Clean up existing data
DELETE FROM supplier_ranking_calculations;
DELETE FROM ranking_factor_weights;
DROP TABLE IF EXISTS evaluation_sections CASCADE;

-- 2. Create evaluation data structure
CREATE TABLE evaluation_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Section data stored as structured JSONB
    overview JSONB DEFAULT '{}',
    cost_analysis JSONB DEFAULT '{}', 
    rating_engine JSONB DEFAULT '{}',
    capability JSONB DEFAULT '{}',
    technical JSONB DEFAULT '{}',
    
    -- Calculated scores
    overall_score DECIMAL(5,2) DEFAULT 0,
    cost_score DECIMAL(5,2) DEFAULT 0,
    rating_score DECIMAL(5,2) DEFAULT 0, 
    capability_score DECIMAL(5,2) DEFAULT 0,
    technical_score DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(nomination_evaluation_id, vendor_id)
);

-- Create indexes for performance
CREATE INDEX idx_eval_sections_nomination ON evaluation_sections(nomination_evaluation_id);
CREATE INDEX idx_eval_sections_vendor ON evaluation_sections(vendor_id);
CREATE INDEX idx_eval_sections_overall_score ON evaluation_sections(overall_score DESC);

-- Add RLS policy
ALTER TABLE evaluation_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY evaluation_sections_policy ON evaluation_sections FOR ALL USING (true);

-- 3. Evaluation functions for real-time editing

-- Get evaluation section data for a specific vendor and section
CREATE OR REPLACE FUNCTION get_evaluation_section(
    p_nomination_evaluation_id UUID,
    p_section TEXT,
    p_vendor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    section_data RECORD;
BEGIN
    -- Get section data
    SELECT * INTO section_data
    FROM evaluation_sections
    WHERE nomination_evaluation_id = p_nomination_evaluation_id
    AND vendor_id = p_vendor_id;
    
    -- If no data exists, return empty object
    IF NOT FOUND THEN
        RETURN '{}'::JSONB;
    END IF;
    
    -- Return specific section data
    CASE p_section
        WHEN 'overview' THEN 
            RETURN COALESCE(section_data.overview, '{}'::JSONB);
        WHEN 'cost_analysis' THEN 
            RETURN COALESCE(section_data.cost_analysis, '{}'::JSONB);
        WHEN 'rating_engine' THEN 
            RETURN COALESCE(section_data.rating_engine, '{}'::JSONB);
        WHEN 'capability' THEN 
            RETURN COALESCE(section_data.capability, '{}'::JSONB);
        WHEN 'technical' THEN 
            RETURN COALESCE(section_data.technical, '{}'::JSONB);
        ELSE
            RETURN '{}'::JSONB;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Save/Update evaluation section data
CREATE OR REPLACE FUNCTION save_evaluation_section(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID,
    p_section TEXT,
    p_data JSONB,
    p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert or update evaluation section
    INSERT INTO evaluation_sections (
        nomination_evaluation_id,
        vendor_id,
        overview,
        cost_analysis,
        rating_engine, 
        capability,
        technical,
        updated_by,
        updated_at
    )
    VALUES (
        p_nomination_evaluation_id,
        p_vendor_id,
        CASE WHEN p_section = 'overview' THEN p_data ELSE '{}' END,
        CASE WHEN p_section = 'cost_analysis' THEN p_data ELSE '{}' END,
        CASE WHEN p_section = 'rating_engine' THEN p_data ELSE '{}' END,
        CASE WHEN p_section = 'capability' THEN p_data ELSE '{}' END,
        CASE WHEN p_section = 'technical' THEN p_data ELSE '{}' END,
        p_updated_by,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (nomination_evaluation_id, vendor_id)
    DO UPDATE SET
        overview = CASE WHEN p_section = 'overview' THEN p_data ELSE evaluation_sections.overview END,
        cost_analysis = CASE WHEN p_section = 'cost_analysis' THEN p_data ELSE evaluation_sections.cost_analysis END,
        rating_engine = CASE WHEN p_section = 'rating_engine' THEN p_data ELSE evaluation_sections.rating_engine END,
        capability = CASE WHEN p_section = 'capability' THEN p_data ELSE evaluation_sections.capability END,
        technical = CASE WHEN p_section = 'technical' THEN p_data ELSE evaluation_sections.technical END,
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Calculate section scores based on data completeness and values
CREATE OR REPLACE FUNCTION calculate_section_scores(
    p_nomination_evaluation_id UUID,
    p_vendor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    section_data RECORD;
    overview_score DECIMAL(5,2) := 0;
    cost_score DECIMAL(5,2) := 0;
    rating_score DECIMAL(5,2) := 0;
    capability_score DECIMAL(5,2) := 0;
    technical_score DECIMAL(5,2) := 0;
    overall_score DECIMAL(5,2) := 0;
BEGIN
    -- Get evaluation data
    SELECT * INTO section_data
    FROM evaluation_sections
    WHERE nomination_evaluation_id = p_nomination_evaluation_id
    AND vendor_id = p_vendor_id;
    
    IF FOUND THEN
        -- Calculate overview score based on data completeness
        overview_score := CASE 
            WHEN jsonb_typeof(section_data.overview) = 'object' AND section_data.overview != '{}'::JSONB 
            THEN 85 ELSE 0 
        END;
        
        -- Calculate cost score from cost analysis data
        cost_score := CASE 
            WHEN jsonb_typeof(section_data.cost_analysis) = 'object' AND section_data.cost_analysis != '{}'::JSONB 
            THEN LEAST(100, GREATEST(0, COALESCE((section_data.cost_analysis->>'total_cost')::DECIMAL, 0) * 10))
            ELSE 0 
        END;
        
        -- Calculate rating score from rating engine metrics
        rating_score := CASE 
            WHEN jsonb_typeof(section_data.rating_engine) = 'object' AND section_data.rating_engine != '{}'::JSONB 
            THEN LEAST(100, GREATEST(0, COALESCE((section_data.rating_engine->>'overall_rating')::DECIMAL, 0)))
            ELSE 0 
        END;
        
        -- Calculate capability score
        capability_score := CASE 
            WHEN jsonb_typeof(section_data.capability) = 'object' AND section_data.capability != '{}'::JSONB 
            THEN 90 ELSE 0 
        END;
        
        -- Calculate technical score
        technical_score := CASE 
            WHEN jsonb_typeof(section_data.technical) = 'object' AND section_data.technical != '{}'::JSONB 
            THEN 88 ELSE 0 
        END;
        
        -- Calculate overall score (weighted average)
        overall_score := (overview_score * 0.15) + (cost_score * 0.35) + (rating_score * 0.25) + (capability_score * 0.15) + (technical_score * 0.10);
        
        -- Update scores in database
        UPDATE evaluation_sections
        SET 
            overall_score = overall_score,
            cost_score = cost_score,
            rating_score = rating_score,
            capability_score = capability_score,
            technical_score = technical_score,
            updated_at = CURRENT_TIMESTAMP
        WHERE nomination_evaluation_id = p_nomination_evaluation_id
        AND vendor_id = p_vendor_id;
    END IF;
    
    RETURN jsonb_build_object(
        'overall_score', overall_score,
        'cost_score', cost_score,
        'rating_score', rating_score,
        'capability_score', capability_score,
        'technical_score', technical_score,
        'overview_score', overview_score
    );
END;
$$ LANGUAGE plpgsql;

-- Supplier ranking calculations
CREATE OR REPLACE FUNCTION store_supplier_rankings(p_nomination_evaluation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rankings_data JSON;
    ranking_item JSON;
BEGIN
    -- Clear existing calculations first
    DELETE FROM supplier_ranking_calculations 
    WHERE nomination_evaluation_id = p_nomination_evaluation_id;
    
    -- Get calculated rankings
    rankings_data := calculate_supplier_rankings(p_nomination_evaluation_id);
    
    -- Check if we have data to process
    IF rankings_data IS NOT NULL AND json_array_length(rankings_data) > 0 THEN
        -- Insert new calculations with ON CONFLICT handling
        FOR ranking_item IN SELECT json_array_elements(rankings_data)
        LOOP
            INSERT INTO supplier_ranking_calculations (
                nomination_evaluation_id,
                vendor_id,
                net_price_unit,
                development_cost,
                lead_time_days,
                cost_rank,
                development_cost_rank,
                lead_time_rank,
                total_score,
                overall_rank
            )
            SELECT 
                p_nomination_evaluation_id,
                (ranking_item->>'vendorId')::UUID,
                COALESCE((vne.cost_analysis->>'net_price_unit')::DECIMAL, 0),
                COALESCE((vne.cost_analysis->>'development_cost')::DECIMAL, 0),
                COALESCE((vne.cost_analysis->>'lead_time_days')::INTEGER, 30),
                (ranking_item->>'costRank')::INTEGER,
                (ranking_item->>'developmentCostRank')::INTEGER,
                (ranking_item->>'leadTimeRank')::INTEGER,
                (ranking_item->>'totalScore')::DECIMAL,
                (ranking_item->>'overallRank')::INTEGER
            FROM vendor_nomination_evaluations vne 
            WHERE vne.vendor_id = (ranking_item->>'vendorId')::UUID
            AND vne.nomination_evaluation_id = p_nomination_evaluation_id
            ON CONFLICT (nomination_evaluation_id, vendor_id) 
            DO UPDATE SET
                net_price_unit = EXCLUDED.net_price_unit,
                development_cost = EXCLUDED.development_cost,
                lead_time_days = EXCLUDED.lead_time_days,
                cost_rank = EXCLUDED.cost_rank,
                development_cost_rank = EXCLUDED.development_cost_rank,
                lead_time_rank = EXCLUDED.lead_time_rank,
                total_score = EXCLUDED.total_score,
                overall_rank = EXCLUDED.overall_rank,
                updated_at = CURRENT_TIMESTAMP;
        END LOOP;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger functions
CREATE OR REPLACE FUNCTION trigger_calculate_scores()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_section_scores(NEW.nomination_evaluation_id, NEW.vendor_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time score calculation
DROP TRIGGER IF EXISTS trigger_score_calculation ON evaluation_sections;
CREATE TRIGGER trigger_score_calculation
    AFTER INSERT OR UPDATE
    ON evaluation_sections
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_scores();

-- Clean up old ranking triggers
DROP TRIGGER IF EXISTS trigger_recalculate_rankings ON supplier_nomination_evaluations;
DROP TRIGGER IF EXISTS trigger_recalculate_rankings_update ON supplier_nomination_evaluations;