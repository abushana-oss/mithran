-- Migration 097: Part-wise Cost Analysis System
-- Stores cost analysis data for each BOM part within supplier nominations

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS part_wise_cost_analysis CASCADE;

-- Create part_wise_cost_analysis table
CREATE TABLE part_wise_cost_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    nomination_id UUID NOT NULL REFERENCES supplier_nominations(id) ON DELETE CASCADE,
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,
    
    -- Cost components (matching the frontend structure)
    raw_material_cost DECIMAL(15, 2) DEFAULT 0,
    process_cost DECIMAL(15, 2) DEFAULT 0,
    overheads_profit DECIMAL(15, 2) DEFAULT 0,
    packing_forwarding_cost DECIMAL(15, 2) DEFAULT 0,
    payment_terms VARCHAR(100),
    net_price_unit DECIMAL(15, 2) DEFAULT 0,
    development_cost DECIMAL(15, 2) DEFAULT 0,
    financial_risk DECIMAL(10, 4) DEFAULT 0, -- Percentage, so 4 decimal places
    cost_competency_score DECIMAL(10, 4) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    
    -- Auto-calculated rankings
    rank_cost INTEGER DEFAULT 0,
    rank_development_cost INTEGER DEFAULT 0,
    rank_lead_time INTEGER DEFAULT 0,
    total_score DECIMAL(10, 4) DEFAULT 0,
    overall_rank INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure one record per nomination-part-vendor combination
    UNIQUE(nomination_id, bom_item_id, vendor_id)
);

-- Create base/reference cost data table (one per nomination-part combination)
CREATE TABLE part_wise_cost_base_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    nomination_id UUID NOT NULL REFERENCES supplier_nominations(id) ON DELETE CASCADE,
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
    
    -- Base/Reference values
    base_raw_material_cost DECIMAL(15, 2) DEFAULT 0,
    base_process_cost DECIMAL(15, 2) DEFAULT 0,
    base_overheads_profit DECIMAL(15, 2) DEFAULT 0,
    base_packing_forwarding_cost DECIMAL(15, 2) DEFAULT 0,
    base_payment_terms VARCHAR(100),
    base_net_price_unit DECIMAL(15, 2) DEFAULT 0,
    base_development_cost DECIMAL(15, 2) DEFAULT 0,
    base_financial_risk DECIMAL(10, 4) DEFAULT 0,
    base_cost_competency_score DECIMAL(10, 4) DEFAULT 0,
    base_lead_time_days INTEGER DEFAULT 0,
    
    -- Ranking factor weights (can be customized per part)
    cost_factor_weight DECIMAL(5, 2) DEFAULT 33.33,
    development_cost_factor_weight DECIMAL(5, 2) DEFAULT 33.33,
    lead_time_factor_weight DECIMAL(5, 2) DEFAULT 33.34,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure one record per nomination-part combination
    UNIQUE(nomination_id, bom_item_id)
);

-- Indexes for performance
CREATE INDEX idx_part_wise_cost_analysis_nomination ON part_wise_cost_analysis(nomination_id);
CREATE INDEX idx_part_wise_cost_analysis_bom_item ON part_wise_cost_analysis(bom_item_id);
CREATE INDEX idx_part_wise_cost_analysis_vendor ON part_wise_cost_analysis(vendor_id);
CREATE INDEX idx_part_wise_cost_analysis_composite ON part_wise_cost_analysis(nomination_id, bom_item_id);

CREATE INDEX idx_part_wise_cost_base_nomination ON part_wise_cost_base_data(nomination_id);
CREATE INDEX idx_part_wise_cost_base_bom_item ON part_wise_cost_base_data(bom_item_id);

-- RLS Policies
ALTER TABLE part_wise_cost_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_wise_cost_base_data ENABLE ROW LEVEL SECURITY;

-- Users can manage cost analysis for their nominations
CREATE POLICY "Users can manage part-wise cost analysis for their nominations"
    ON part_wise_cost_analysis FOR ALL
    USING (EXISTS (
        SELECT 1 FROM supplier_nominations sn
        JOIN project_modules pm ON pm.id = sn.project_module_id
        JOIN projects p ON p.id = pm.project_id
        WHERE sn.id = part_wise_cost_analysis.nomination_id 
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage part-wise cost base data for their nominations"
    ON part_wise_cost_base_data FOR ALL
    USING (EXISTS (
        SELECT 1 FROM supplier_nominations sn
        JOIN project_modules pm ON pm.id = sn.project_module_id
        JOIN projects p ON p.id = pm.project_id
        WHERE sn.id = part_wise_cost_base_data.nomination_id 
        AND p.user_id = auth.uid()
    ));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_part_wise_cost_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER part_wise_cost_analysis_updated_at
    BEFORE UPDATE ON part_wise_cost_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_part_wise_cost_analysis_updated_at();

CREATE TRIGGER part_wise_cost_base_data_updated_at
    BEFORE UPDATE ON part_wise_cost_base_data
    FOR EACH ROW
    EXECUTE FUNCTION update_part_wise_cost_analysis_updated_at();

-- Function to calculate rankings for a specific nomination and BOM part
CREATE OR REPLACE FUNCTION calculate_part_wise_rankings(
    p_nomination_id UUID,
    p_bom_item_id UUID
) RETURNS void AS $$
DECLARE
    base_weights RECORD;
BEGIN
    -- Get the factor weights for this part
    SELECT 
        cost_factor_weight,
        development_cost_factor_weight,
        lead_time_factor_weight
    INTO base_weights
    FROM part_wise_cost_base_data
    WHERE nomination_id = p_nomination_id AND bom_item_id = p_bom_item_id;
    
    -- If no base weights found, use defaults
    IF base_weights IS NULL THEN
        base_weights.cost_factor_weight := 33.33;
        base_weights.development_cost_factor_weight := 33.33;
        base_weights.lead_time_factor_weight := 33.34;
    END IF;
    
    -- Calculate cost rankings (lowest cost = rank 1)
    WITH cost_ranks AS (
        SELECT 
            id,
            RANK() OVER (ORDER BY net_price_unit ASC) as cost_rank
        FROM part_wise_cost_analysis
        WHERE nomination_id = p_nomination_id 
        AND bom_item_id = p_bom_item_id
        AND net_price_unit > 0
    )
    UPDATE part_wise_cost_analysis pca
    SET rank_cost = COALESCE(cr.cost_rank, 0)
    FROM cost_ranks cr
    WHERE pca.id = cr.id;
    
    -- Calculate development cost rankings (lowest cost = rank 1)
    WITH dev_cost_ranks AS (
        SELECT 
            id,
            RANK() OVER (ORDER BY development_cost ASC) as dev_cost_rank
        FROM part_wise_cost_analysis
        WHERE nomination_id = p_nomination_id 
        AND bom_item_id = p_bom_item_id
        AND development_cost > 0
    )
    UPDATE part_wise_cost_analysis pca
    SET rank_development_cost = COALESCE(dcr.dev_cost_rank, 0)
    FROM dev_cost_ranks dcr
    WHERE pca.id = dcr.id;
    
    -- Calculate lead time rankings (shortest time = rank 1)
    WITH lead_time_ranks AS (
        SELECT 
            id,
            RANK() OVER (ORDER BY lead_time_days ASC) as lead_time_rank
        FROM part_wise_cost_analysis
        WHERE nomination_id = p_nomination_id 
        AND bom_item_id = p_bom_item_id
        AND lead_time_days > 0
    )
    UPDATE part_wise_cost_analysis pca
    SET rank_lead_time = COALESCE(ltr.lead_time_rank, 0)
    FROM lead_time_ranks ltr
    WHERE pca.id = ltr.id;
    
    -- Calculate total scores and overall rankings
    UPDATE part_wise_cost_analysis
    SET 
        total_score = (
            (rank_cost * base_weights.cost_factor_weight / 100.0) +
            (rank_development_cost * base_weights.development_cost_factor_weight / 100.0) +
            (rank_lead_time * base_weights.lead_time_factor_weight / 100.0)
        )
    WHERE nomination_id = p_nomination_id AND bom_item_id = p_bom_item_id;
    
    -- Calculate overall rankings (lowest total score = rank 1)
    WITH overall_ranks AS (
        SELECT 
            id,
            RANK() OVER (ORDER BY total_score ASC) as overall_ranking
        FROM part_wise_cost_analysis
        WHERE nomination_id = p_nomination_id 
        AND bom_item_id = p_bom_item_id
        AND total_score > 0
    )
    UPDATE part_wise_cost_analysis pca
    SET overall_rank = COALESCE(ovr.overall_ranking, 0)
    FROM overall_ranks ovr
    WHERE pca.id = ovr.id;
    
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE part_wise_cost_analysis IS 'Stores cost analysis data for each BOM part and vendor combination within supplier nominations';
COMMENT ON TABLE part_wise_cost_base_data IS 'Stores base/reference cost data and factor weights for each BOM part within nominations';
COMMENT ON FUNCTION calculate_part_wise_rankings(UUID, UUID) IS 'Calculates rankings and scores for vendors on a specific BOM part';