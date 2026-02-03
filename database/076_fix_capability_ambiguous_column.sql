-- Fix ambiguous column reference in initialize_capability_criteria function

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

-- Also update the get_capability_data function to be more explicit
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
        cc.id AS criteria_id,
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