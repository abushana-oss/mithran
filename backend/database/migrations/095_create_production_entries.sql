-- Create production_entries table
CREATE TABLE production_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    process_id UUID REFERENCES production_processes(id) ON DELETE SET NULL,
    process_name TEXT NOT NULL, -- Store process name for historical data
    entry_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('MORNING', 'AFTERNOON', 'NIGHT')),
    target_quantity INTEGER NOT NULL DEFAULT 0,
    produced_quantity INTEGER NOT NULL DEFAULT 0,
    rejected_quantity INTEGER NOT NULL DEFAULT 0,
    rework_quantity INTEGER NOT NULL DEFAULT 0,
    downtime_minutes INTEGER NOT NULL DEFAULT 0,
    downtime_reason TEXT,
    quality_issues TEXT,
    operator_notes TEXT,
    entered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_production_entries_lot_id ON production_entries(lot_id);
CREATE INDEX idx_production_entries_process_id ON production_entries(process_id);
CREATE INDEX idx_production_entries_date ON production_entries(entry_date);
CREATE INDEX idx_production_entries_shift ON production_entries(shift);
CREATE INDEX idx_production_entries_date_shift ON production_entries(entry_date, shift);

-- Create unique constraint to prevent duplicate entries for same lot, process, date, and shift
CREATE UNIQUE INDEX idx_production_entries_unique 
ON production_entries(lot_id, process_id, entry_date, shift) 
WHERE process_id IS NOT NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view production entries for lots they created
CREATE POLICY "Users can view production entries for their lots" ON production_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM production_lots 
            WHERE production_lots.id = production_entries.lot_id
            AND production_lots.created_by = auth.uid()
        )
    );

-- Policy: Users can insert production entries for lots they created
CREATE POLICY "Users can insert production entries for their lots" ON production_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM production_lots 
            WHERE production_lots.id = production_entries.lot_id
            AND production_lots.created_by = auth.uid()
        )
    );

-- Policy: Users can update production entries for lots they created
CREATE POLICY "Users can update production entries for their lots" ON production_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM production_lots 
            WHERE production_lots.id = production_entries.lot_id
            AND production_lots.created_by = auth.uid()
        )
    );

-- Policy: Users can delete production entries for lots they created
CREATE POLICY "Users can delete production entries for their lots" ON production_entries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM production_lots 
            WHERE production_lots.id = production_entries.lot_id
            AND production_lots.created_by = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_production_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_production_entries_updated_at
    BEFORE UPDATE ON production_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_production_entries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE production_entries IS 'Records production metrics for each process, date, and shift';
COMMENT ON COLUMN production_entries.lot_id IS 'Reference to the production lot';
COMMENT ON COLUMN production_entries.process_id IS 'Reference to the production process (nullable for historical data)';
COMMENT ON COLUMN production_entries.process_name IS 'Name of the process at time of entry';
COMMENT ON COLUMN production_entries.entry_date IS 'Date of production';
COMMENT ON COLUMN production_entries.shift IS 'Work shift (MORNING, AFTERNOON, NIGHT)';
COMMENT ON COLUMN production_entries.target_quantity IS 'Target production quantity for the shift';
COMMENT ON COLUMN production_entries.produced_quantity IS 'Actual quantity produced';
COMMENT ON COLUMN production_entries.rejected_quantity IS 'Number of units rejected due to quality issues';
COMMENT ON COLUMN production_entries.rework_quantity IS 'Number of units requiring rework';
COMMENT ON COLUMN production_entries.downtime_minutes IS 'Total downtime in minutes';
COMMENT ON COLUMN production_entries.downtime_reason IS 'Reason for downtime';
COMMENT ON COLUMN production_entries.quality_issues IS 'Description of quality issues encountered';
COMMENT ON COLUMN production_entries.operator_notes IS 'Additional notes from the operator';
COMMENT ON COLUMN production_entries.entered_by IS 'User who entered the production data';