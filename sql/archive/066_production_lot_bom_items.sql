-- Migration to add production_lot_bom_items table for tracking selected BOM items in production lots

-- Create production_lot_bom_items table
CREATE TABLE production_lot_bom_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    production_lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    bom_item_id UUID NOT NULL REFERENCES bom_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate combinations
    UNIQUE(production_lot_id, bom_item_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_production_lot_bom_items_lot_id ON production_lot_bom_items(production_lot_id);
CREATE INDEX idx_production_lot_bom_items_bom_item_id ON production_lot_bom_items(bom_item_id);

-- Add RLS policies
ALTER TABLE production_lot_bom_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/manage items for production lots they own (through BOM ownership)
CREATE POLICY "Users can manage production lot BOM items for their BOMs" ON production_lot_bom_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM production_lots pl
            JOIN boms b ON pl.bom_id = b.id
            WHERE pl.id = production_lot_bom_items.production_lot_id
            AND b.user_id = auth.uid()
        )
    );