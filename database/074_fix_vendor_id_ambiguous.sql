-- Fix ambiguous vendor_id column reference in initialize_cost_competency_analysis function
-- This addresses the error: column reference "vendor_id" is ambiguous

CREATE OR REPLACE FUNCTION initialize_cost_competency_analysis(
    p_nomination_evaluation_id UUID,
    p_vendor_ids UUID[]
) RETURNS VOID AS $$
DECLARE
    cost_component_id UUID;
    current_vendor_id UUID;
    cost_components TEXT[] := ARRAY[
        'Raw Material Cost',
        'Process Cost', 
        'Overheads & Profit',
        'Packing & Forwarding Cost',
        'Payment Terms',
        'Net Price/unit',
        'Development cost',
        'Financial Risk',
        'Cost Competency Score',
        'Lead Time Days',
        'Rank-Cost',
        'Rank-Development cost', 
        'Lead Time Ranking',
        'Total Score',
        'Overall Rank'
    ];
    cost_units TEXT[] := ARRAY[
        '₹', '₹', '₹', '₹', '', '₹', 'Lakhs', '%', 'Score', 'Days', '', '', '', 'Score', ''
    ];
    ranking_flags BOOLEAN[] := ARRAY[
        FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 
        TRUE, TRUE, TRUE, TRUE, TRUE
    ];
    component_name TEXT;
    component_unit TEXT;
    is_ranking_component BOOLEAN;
    i INTEGER;
BEGIN
    -- Insert cost components
    FOR i IN 1..array_length(cost_components, 1) LOOP
        component_name := cost_components[i];
        component_unit := cost_units[i];
        is_ranking_component := ranking_flags[i];
        
        INSERT INTO cost_competency_analysis (
            nomination_evaluation_id,
            cost_component,
            base_value,
            unit,
            is_ranking,
            sort_order
        ) VALUES (
            p_nomination_evaluation_id,
            component_name,
            CASE WHEN is_ranking_component THEN NULL ELSE 0 END,
            component_unit,
            is_ranking_component,
            i
        ) ON CONFLICT (nomination_evaluation_id, cost_component) DO NOTHING
        RETURNING id INTO cost_component_id;
        
        -- Insert vendor values for each cost component
        IF cost_component_id IS NOT NULL THEN
            FOREACH current_vendor_id IN ARRAY p_vendor_ids LOOP
                INSERT INTO cost_competency_vendor_values (
                    cost_analysis_id,
                    vendor_id,
                    numeric_value,
                    text_value
                ) VALUES (
                    cost_component_id,
                    current_vendor_id,
                    CASE WHEN is_ranking_component THEN NULL ELSE 0 END,
                    CASE WHEN component_name = 'Payment Terms' THEN '' ELSE NULL END
                ) ON CONFLICT (cost_analysis_id, vendor_id) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;