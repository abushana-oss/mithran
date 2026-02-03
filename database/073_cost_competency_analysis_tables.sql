-- Cost Competency Analysis Real-time Data Storage
-- Principal Engineer Best Practice: Scalable enterprise B2B SaaS solution
-- Created for real-time cost analysis with vendor-specific data

-- Create table for cost competency analysis data
CREATE TABLE IF NOT EXISTS cost_competency_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomination_evaluation_id UUID NOT NULL REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE,
    cost_component VARCHAR(100) NOT NULL,
    base_value DECIMAL(15,4),
    base_payment_term VARCHAR(100),
    unit VARCHAR(20),
    is_ranking BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_nomination_cost_component UNIQUE(nomination_evaluation_id, cost_component)
);

-- Create table for vendor-specific cost values
CREATE TABLE IF NOT EXISTS cost_competency_vendor_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_analysis_id UUID NOT NULL REFERENCES cost_competency_analysis(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,
    numeric_value DECIMAL(15,4),
    text_value VARCHAR(255), -- For payment terms, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_cost_analysis_vendor UNIQUE(cost_analysis_id, vendor_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cost_analysis_nomination_id ON cost_competency_analysis(nomination_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_component ON cost_competency_analysis(cost_component);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_sort_order ON cost_competency_analysis(sort_order);
CREATE INDEX IF NOT EXISTS idx_cost_vendor_values_analysis_id ON cost_competency_vendor_values(cost_analysis_id);
CREATE INDEX IF NOT EXISTS idx_cost_vendor_values_vendor_id ON cost_competency_vendor_values(vendor_id);

-- Add trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_cost_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cost_analysis_updated_at
    BEFORE UPDATE ON cost_competency_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_cost_analysis_updated_at();

CREATE TRIGGER trigger_update_cost_vendor_values_updated_at
    BEFORE UPDATE ON cost_competency_vendor_values
    FOR EACH ROW
    EXECUTE FUNCTION update_cost_analysis_updated_at();

-- Enable Row Level Security
ALTER TABLE cost_competency_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_competency_vendor_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cost_competency_analysis
CREATE POLICY "Users can view their own cost analysis data" ON cost_competency_analysis
    FOR SELECT USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own cost analysis data" ON cost_competency_analysis
    FOR INSERT WITH CHECK (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own cost analysis data" ON cost_competency_analysis
    FOR UPDATE USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own cost analysis data" ON cost_competency_analysis
    FOR DELETE USING (
        nomination_evaluation_id IN (
            SELECT id FROM supplier_nomination_evaluations WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for cost_competency_vendor_values
CREATE POLICY "Users can view their own cost vendor values" ON cost_competency_vendor_values
    FOR SELECT USING (
        cost_analysis_id IN (
            SELECT ca.id FROM cost_competency_analysis ca
            JOIN supplier_nomination_evaluations sne ON ca.nomination_evaluation_id = sne.id
            WHERE sne.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own cost vendor values" ON cost_competency_vendor_values
    FOR INSERT WITH CHECK (
        cost_analysis_id IN (
            SELECT ca.id FROM cost_competency_analysis ca
            JOIN supplier_nomination_evaluations sne ON ca.nomination_evaluation_id = sne.id
            WHERE sne.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own cost vendor values" ON cost_competency_vendor_values
    FOR UPDATE USING (
        cost_analysis_id IN (
            SELECT ca.id FROM cost_competency_analysis ca
            JOIN supplier_nomination_evaluations sne ON ca.nomination_evaluation_id = sne.id
            WHERE sne.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own cost vendor values" ON cost_competency_vendor_values
    FOR DELETE USING (
        cost_analysis_id IN (
            SELECT ca.id FROM cost_competency_analysis ca
            JOIN supplier_nomination_evaluations sne ON ca.nomination_evaluation_id = sne.id
            WHERE sne.user_id = auth.uid()
        )
    );

-- Function to initialize default cost components for a nomination
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

-- Comments for documentation
COMMENT ON TABLE cost_competency_analysis IS 'Real-time cost competency analysis data for supplier nominations';
COMMENT ON TABLE cost_competency_vendor_values IS 'Vendor-specific values for cost competency analysis components';
COMMENT ON FUNCTION initialize_cost_competency_analysis IS 'Initializes default cost components and vendor values for a nomination';
COMMENT ON COLUMN cost_competency_analysis.nomination_evaluation_id IS 'Reference to the supplier nomination evaluation';
COMMENT ON COLUMN cost_competency_analysis.cost_component IS 'Name of the cost component (Raw Material Cost, etc.)';
COMMENT ON COLUMN cost_competency_analysis.base_value IS 'Base/reference value for comparison';
COMMENT ON COLUMN cost_competency_analysis.base_payment_term IS 'Base payment term for Payment Terms component';
COMMENT ON COLUMN cost_competency_analysis.is_ranking IS 'Whether this component is auto-calculated ranking data';
COMMENT ON COLUMN cost_competency_vendor_values.numeric_value IS 'Numeric value for the vendor (cost, score, etc.)';
COMMENT ON COLUMN cost_competency_vendor_values.text_value IS 'Text value for the vendor (payment terms, etc.)';