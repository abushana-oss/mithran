-- ============================================================================
-- Migration: Enhanced Vendor Quotes System for Supplier Nominations
-- Description: Add vendor quote management with pricing and delivery tracking
-- ============================================================================

-- ============================================================================
-- VENDOR QUOTES TABLE
-- ============================================================================

CREATE TABLE vendor_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomination_evaluation_id UUID NOT NULL REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Quote identification
    quote_number VARCHAR(100) NOT NULL,
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Quote status and workflow
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired')
    ),
    
    -- Commercial terms
    payment_terms VARCHAR(255),
    delivery_terms VARCHAR(255),
    warranty_terms TEXT,
    special_conditions TEXT,
    
    -- Quote totals (calculated from line items)
    subtotal_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Contact information
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Internal tracking
    requested_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique quote numbers per vendor per nomination
    UNIQUE(nomination_evaluation_id, vendor_id, quote_number)
);

-- ============================================================================
-- VENDOR QUOTE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE vendor_quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_quote_id UUID NOT NULL REFERENCES vendor_quotes(id) ON DELETE CASCADE,
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
    
    -- Line item identification
    line_number INTEGER NOT NULL,
    part_description TEXT,
    
    -- Pricing details
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(15, 2) NOT NULL CHECK (total_price >= 0),
    
    -- Delivery information
    lead_time_days INTEGER NOT NULL CHECK (lead_time_days >= 0),
    delivery_date DATE NOT NULL,
    production_capacity_per_month INTEGER DEFAULT 0,
    minimum_order_quantity DECIMAL(12, 3) DEFAULT 1,
    
    -- Technical specifications
    material_grade VARCHAR(100),
    finish_specification VARCHAR(255),
    quality_standard VARCHAR(100),
    certification_requirements TEXT,
    packaging_requirement TEXT,
    
    -- Additional costs
    tooling_cost DECIMAL(12, 2) DEFAULT 0 CHECK (tooling_cost >= 0),
    setup_cost DECIMAL(12, 2) DEFAULT 0 CHECK (setup_cost >= 0),
    shipping_cost DECIMAL(12, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
    handling_cost DECIMAL(12, 2) DEFAULT 0 CHECK (handling_cost >= 0),
    
    -- Terms specific to this line item
    price_validity_days INTEGER DEFAULT 30,
    payment_terms_override VARCHAR(255),
    warranty_period_months INTEGER DEFAULT 12,
    
    -- Notes and documentation
    remarks TEXT,
    technical_notes TEXT,
    compliance_notes TEXT,
    risk_assessment TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique line items per quote
    UNIQUE(vendor_quote_id, bom_item_id),
    UNIQUE(vendor_quote_id, line_number)
);

-- ============================================================================
-- ENHANCE EXISTING VENDOR ASSIGNMENT TABLE
-- ============================================================================

-- Add quote tracking to existing supplier_nomination_bom_part_vendors table
ALTER TABLE supplier_nomination_bom_part_vendors 
ADD COLUMN IF NOT EXISTS selected_quote_line_item_id UUID REFERENCES vendor_quote_line_items(id),
ADD COLUMN IF NOT EXISTS quoted_unit_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS quoted_total_price DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS quoted_delivery_date DATE,
ADD COLUMN IF NOT EXISTS quoted_lead_time_days INTEGER,
ADD COLUMN IF NOT EXISTS assignment_reason TEXT,
ADD COLUMN IF NOT EXISTS cost_competitiveness_score DECIMAL(5, 2) CHECK (cost_competitiveness_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS delivery_competitiveness_score DECIMAL(5, 2) CHECK (delivery_competitiveness_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS quality_competitiveness_score DECIMAL(5, 2) CHECK (quality_competitiveness_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS overall_selection_score DECIMAL(5, 2) CHECK (overall_selection_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS selection_status VARCHAR(50) DEFAULT 'pending' CHECK (
    selection_status IN ('pending', 'selected', 'alternate', 'rejected')
),
ADD COLUMN IF NOT EXISTS selected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS selected_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- VENDOR QUOTE COMPARISON VIEW
-- ============================================================================

CREATE VIEW vendor_quote_comparison AS
SELECT 
    n.id AS nomination_id,
    n.nomination_name,
    bi.id AS bom_item_id,
    bi.name AS bom_item_name,
    bi.part_number,
    bi.quantity AS required_quantity,
    
    -- Vendor information
    v.id AS vendor_id,
    v.name AS vendor_name,
    v.supplier_code,
    v.city AS vendor_city,
    
    -- Quote information
    q.id AS quote_id,
    q.quote_number,
    q.quote_date,
    q.valid_until,
    q.status AS quote_status,
    
    -- Line item details
    qli.id AS line_item_id,
    qli.unit_price,
    qli.quantity AS quoted_quantity,
    qli.total_price,
    qli.lead_time_days,
    qli.delivery_date,
    qli.tooling_cost,
    qli.setup_cost,
    qli.shipping_cost,
    
    -- Calculated fields
    qli.total_price + qli.tooling_cost + qli.setup_cost + qli.shipping_cost AS total_cost_including_extras,
    
    -- Assignment status
    snbpv.selection_status,
    snbpv.overall_selection_score,
    snbpv.assignment_reason
    
FROM supplier_nomination_evaluations n
JOIN supplier_nomination_bom_parts snbp ON snbp.nomination_evaluation_id = n.id
JOIN bom_items bi ON bi.id = snbp.bom_item_id
JOIN vendor_quotes q ON q.nomination_evaluation_id = n.id
JOIN vendors v ON v.id = q.vendor_id
JOIN vendor_quote_line_items qli ON qli.vendor_quote_id = q.id AND qli.bom_item_id = bi.id
LEFT JOIN supplier_nomination_bom_part_vendors snbpv ON snbpv.nomination_bom_part_id = snbp.id 
    AND snbpv.vendor_id = v.id;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vendor quotes indexes
CREATE INDEX idx_vendor_quotes_nomination ON vendor_quotes(nomination_evaluation_id);
CREATE INDEX idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);
CREATE INDEX idx_vendor_quotes_status ON vendor_quotes(status);
CREATE INDEX idx_vendor_quotes_date ON vendor_quotes(quote_date);

-- Quote line items indexes
CREATE INDEX idx_quote_line_items_quote ON vendor_quote_line_items(vendor_quote_id);
CREATE INDEX idx_quote_line_items_bom ON vendor_quote_line_items(bom_item_id);
CREATE INDEX idx_quote_line_items_delivery ON vendor_quote_line_items(delivery_date);

-- Enhanced vendor assignment indexes
CREATE INDEX idx_vendor_assignments_quote_line ON supplier_nomination_bom_part_vendors(selected_quote_line_item_id) WHERE selected_quote_line_item_id IS NOT NULL;
CREATE INDEX idx_vendor_assignments_status ON supplier_nomination_bom_part_vendors(selection_status);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_quotes
CREATE POLICY "Users can manage vendor quotes for their nominations"
    ON vendor_quotes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM supplier_nomination_evaluations sne
        WHERE sne.id = vendor_quotes.nomination_evaluation_id 
        AND sne.user_id = auth.uid()
    ));

-- RLS Policies for vendor_quote_line_items
CREATE POLICY "Users can manage quote line items for their nominations"
    ON vendor_quote_line_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM vendor_quotes vq
        JOIN supplier_nomination_evaluations sne ON sne.id = vq.nomination_evaluation_id
        WHERE vq.id = vendor_quote_line_items.vendor_quote_id 
        AND sne.user_id = auth.uid()
    ));

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Update quote totals when line items change
CREATE OR REPLACE FUNCTION update_quote_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the quote totals based on line items
    UPDATE vendor_quotes 
    SET 
        subtotal_amount = (
            SELECT COALESCE(SUM(total_price + tooling_cost + setup_cost + shipping_cost + handling_cost), 0)
            FROM vendor_quote_line_items 
            WHERE vendor_quote_id = COALESCE(NEW.vendor_quote_id, OLD.vendor_quote_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.vendor_quote_id, OLD.vendor_quote_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for quote total updates
CREATE TRIGGER trigger_update_quote_totals_insert
    AFTER INSERT ON vendor_quote_line_items
    FOR EACH ROW EXECUTE FUNCTION update_quote_totals();

CREATE TRIGGER trigger_update_quote_totals_update
    AFTER UPDATE ON vendor_quote_line_items
    FOR EACH ROW EXECUTE FUNCTION update_quote_totals();

CREATE TRIGGER trigger_update_quote_totals_delete
    AFTER DELETE ON vendor_quote_line_items
    FOR EACH ROW EXECUTE FUNCTION update_quote_totals();

-- Update assignment data when quote line item is selected
CREATE OR REPLACE FUNCTION sync_vendor_assignment_from_quote()
RETURNS TRIGGER AS $$
BEGIN
    -- When a quote line item is selected, sync the assignment data
    UPDATE supplier_nomination_bom_part_vendors
    SET 
        quoted_unit_price = qli.unit_price,
        quoted_total_price = qli.total_price,
        quoted_delivery_date = qli.delivery_date,
        quoted_lead_time_days = qli.lead_time_days,
        updated_at = NOW()
    FROM vendor_quote_line_items qli
    WHERE supplier_nomination_bom_part_vendors.selected_quote_line_item_id = qli.id
    AND qli.id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_vendor_assignment
    AFTER UPDATE ON vendor_quote_line_items
    FOR EACH ROW 
    WHEN (OLD.unit_price IS DISTINCT FROM NEW.unit_price 
          OR OLD.total_price IS DISTINCT FROM NEW.total_price 
          OR OLD.delivery_date IS DISTINCT FROM NEW.delivery_date 
          OR OLD.lead_time_days IS DISTINCT FROM NEW.lead_time_days)
    EXECUTE FUNCTION sync_vendor_assignment_from_quote();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate competitiveness scores
CREATE OR REPLACE FUNCTION calculate_vendor_competitiveness_scores(
    nomination_id UUID,
    bom_item_id UUID
)
RETURNS TABLE (
    vendor_id UUID,
    cost_score DECIMAL(5,2),
    delivery_score DECIMAL(5,2),
    overall_score DECIMAL(5,2)
) AS $$
DECLARE
    min_price DECIMAL(12,2);
    max_price DECIMAL(12,2);
    min_lead_time INTEGER;
    max_lead_time INTEGER;
BEGIN
    -- Get min/max values for scoring
    SELECT 
        MIN(qli.unit_price), MAX(qli.unit_price),
        MIN(qli.lead_time_days), MAX(qli.lead_time_days)
    INTO min_price, max_price, min_lead_time, max_lead_time
    FROM vendor_quotes vq
    JOIN vendor_quote_line_items qli ON qli.vendor_quote_id = vq.id
    WHERE vq.nomination_evaluation_id = nomination_id
    AND qli.bom_item_id = bom_item_id
    AND vq.status = 'submitted';
    
    -- Return competitiveness scores
    RETURN QUERY
    SELECT 
        vq.vendor_id,
        -- Cost score: lower price = higher score (inverted scale)
        CASE 
            WHEN max_price = min_price THEN 100.00
            ELSE ROUND((100 * (max_price - qli.unit_price) / (max_price - min_price))::NUMERIC, 2)
        END::DECIMAL(5,2) AS cost_score,
        -- Delivery score: shorter lead time = higher score (inverted scale)
        CASE 
            WHEN max_lead_time = min_lead_time THEN 100.00
            ELSE ROUND((100 * (max_lead_time - qli.lead_time_days) / (max_lead_time - min_lead_time))::NUMERIC, 2)
        END::DECIMAL(5,2) AS delivery_score,
        -- Overall score: weighted average (60% cost, 40% delivery)
        ROUND((
            0.6 * CASE 
                WHEN max_price = min_price THEN 100.00
                ELSE (100 * (max_price - qli.unit_price) / (max_price - min_price))
            END +
            0.4 * CASE 
                WHEN max_lead_time = min_lead_time THEN 100.00
                ELSE (100 * (max_lead_time - qli.lead_time_days) / (max_lead_time - min_lead_time))
            END
        )::NUMERIC, 2)::DECIMAL(5,2) AS overall_score
    FROM vendor_quotes vq
    JOIN vendor_quote_line_items qli ON qli.vendor_quote_id = vq.id
    WHERE vq.nomination_evaluation_id = nomination_id
    AND qli.bom_item_id = bom_item_id
    AND vq.status = 'submitted';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Vendor Quotes System migration completed successfully!';
    RAISE NOTICE 'Tables created: vendor_quotes, vendor_quote_line_items';
    RAISE NOTICE 'View created: vendor_quote_comparison';
    RAISE NOTICE 'Enhanced table: supplier_nomination_bom_part_vendors';
    RAISE NOTICE 'Functions created: update_quote_totals, sync_vendor_assignment_from_quote, calculate_vendor_competitiveness_scores';
END $$;