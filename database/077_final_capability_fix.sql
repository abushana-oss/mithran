-- Drop and recreate the initialization function to avoid any ambiguous references
DROP FUNCTION IF EXISTS initialize_capability_criteria(UUID, UUID[]);

CREATE OR REPLACE FUNCTION initialize_capability_criteria(
    p_nomination_evaluation_id UUID,
    p_vendor_ids UUID[]
) RETURNS VOID AS $$
DECLARE
    new_criteria_id UUID;
    current_vendor_id UUID;
    criteria_names TEXT[] := ARRAY[
        'Material Availability',
        'Process Flow & Equipment Selection', 
        'Project Control',
        'Capacity & Leadtime',
        'Product & Process feasibility',
        'Financial Analysis'
    ];
    criteria_max_scores INTEGER[] := ARRAY[10, 15, 20, 25, 15, 15];
    current_criteria_name TEXT;
    current_max_score INTEGER;
    loop_counter INTEGER;
BEGIN
    -- Insert default criteria
    FOR loop_counter IN 1..array_length(criteria_names, 1) LOOP
        current_criteria_name := criteria_names[loop_counter];
        current_max_score := criteria_max_scores[loop_counter];
        
        -- Insert or update capability criteria
        INSERT INTO capability_criteria (
            nomination_evaluation_id,
            criteria_name,
            max_score,
            sort_order
        ) VALUES (
            p_nomination_evaluation_id,
            current_criteria_name,
            current_max_score,
            loop_counter
        ) ON CONFLICT (nomination_evaluation_id, criteria_name) 
        DO UPDATE SET
            max_score = EXCLUDED.max_score,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
        RETURNING id INTO new_criteria_id;
        
        -- Insert default scores (0) for each vendor for this criteria
        FOREACH current_vendor_id IN ARRAY p_vendor_ids LOOP
            INSERT INTO capability_vendor_scores (
                criteria_id,
                vendor_id,
                score
            ) VALUES (
                new_criteria_id,
                current_vendor_id,
                0
            ) ON CONFLICT (criteria_id, vendor_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;