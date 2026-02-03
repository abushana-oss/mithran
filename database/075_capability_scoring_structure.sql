-- Create structured capability scoring tables
-- This replaces the JSONB approach with proper relational structure

-- Capability criteria definition table
CREATE TABLE IF NOT EXISTS capability_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE,
    criteria_name VARCHAR(255) NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_nomination_capability_criteria UNIQUE(nomination_evaluation_id, criteria_name)
);

-- Individual capability scores per vendor per criteria
CREATE TABLE IF NOT EXISTS capability_vendor_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criteria_id UUID NOT NULL REFERENCES capability_criteria(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_criteria_vendor_score UNIQUE(criteria_id, vendor_id),
    CONSTRAINT chk_score_valid CHECK (score >= 0)
);

-- Add RLS policies for security
ALTER TABLE capability_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_vendor_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for capability_criteria  
CREATE POLICY capability_criteria_user_access ON capability_criteria
    FOR ALL USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations 
            WHERE user_id = (auth.uid())::text
        )
    );

-- RLS policies for capability_vendor_scores  
CREATE POLICY capability_vendor_scores_user_access ON capability_vendor_scores
    FOR ALL USING (
        criteria_id IN (
            SELECT cc.id FROM capability_criteria cc
            JOIN supplier_nomination_evaluations sne ON cc.nomination_evaluation_id = sne.id
            WHERE sne.user_id = (auth.uid())::text
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_capability_criteria_nomination ON capability_criteria(nomination_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_capability_vendor_scores_criteria ON capability_vendor_scores(criteria_id);
CREATE INDEX IF NOT EXISTS idx_capability_vendor_scores_vendor ON capability_vendor_scores(vendor_id);

-- Function to initialize default capability criteria for a nomination
CREATE OR REPLACE FUNCTION initialize_capability_criteria(
    p_nomination_evaluation_id UUID,
    p_vendor_ids UUID[]
) RETURNS VOID AS $$
DECLARE
    criteria_id UUID;
    current_vendor_id UUID;
    default_criteria TEXT[] := ARRAY[
        'Material Availability',
        'Process Flow & Equipment Selection', 
        'Project Control',
        'Capacity & Leadtime',
        'Product & Process feasibility',
        'Financial Analysis'
    ];
    criteria_scores INTEGER[] := ARRAY[10, 15, 20, 25, 15, 15];
    criteria_name TEXT;
    max_score INTEGER;
    i INTEGER;
BEGIN
    -- Insert default criteria
    FOR i IN 1..array_length(default_criteria, 1) LOOP
        criteria_name := default_criteria[i];
        max_score := criteria_scores[i];
        
        INSERT INTO capability_criteria (
            nomination_evaluation_id,
            criteria_name,
            max_score,
            sort_order
        ) VALUES (
            p_nomination_evaluation_id,
            criteria_name,
            max_score,
            i
        ) ON CONFLICT (nomination_evaluation_id, criteria_name) DO UPDATE SET
            max_score = EXCLUDED.max_score,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
        RETURNING id INTO criteria_id;
        
        -- Insert default scores (0) for each vendor
        FOREACH current_vendor_id IN ARRAY p_vendor_ids LOOP
            INSERT INTO capability_vendor_scores (
                criteria_id,
                vendor_id,
                score
            ) VALUES (
                criteria_id,
                current_vendor_id,
                0
            ) ON CONFLICT (criteria_id, vendor_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get capability data for a nomination
CREATE OR REPLACE FUNCTION get_capability_data(p_nomination_evaluation_id UUID)
RETURNS TABLE (
    criteria_id UUID,
    criteria_name VARCHAR(255),
    max_score INTEGER,
    sort_order INTEGER,
    vendor_scores JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.criteria_name,
        cc.max_score,
        cc.sort_order,
        COALESCE(
            jsonb_object_agg(
                cvs.vendor_id,
                cvs.score
            ) FILTER (WHERE cvs.vendor_id IS NOT NULL),
            '{}'::jsonb
        ) AS vendor_scores
    FROM capability_criteria cc
    LEFT JOIN capability_vendor_scores cvs ON cc.id = cvs.criteria_id
    WHERE cc.nomination_evaluation_id = p_nomination_evaluation_id
    GROUP BY cc.id, cc.criteria_name, cc.max_score, cc.sort_order
    ORDER BY cc.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update capability score for a specific vendor and criteria
CREATE OR REPLACE FUNCTION update_capability_score(
    p_criteria_id UUID,
    p_vendor_id UUID,
    p_score INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validate score against max_score
    IF p_score < 0 OR p_score > (SELECT max_score FROM capability_criteria WHERE id = p_criteria_id) THEN
        RAISE EXCEPTION 'Score % is invalid for criteria %', p_score, p_criteria_id;
    END IF;
    
    INSERT INTO capability_vendor_scores (criteria_id, vendor_id, score)
    VALUES (p_criteria_id, p_vendor_id, p_score)
    ON CONFLICT (criteria_id, vendor_id) 
    DO UPDATE SET 
        score = EXCLUDED.score,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;