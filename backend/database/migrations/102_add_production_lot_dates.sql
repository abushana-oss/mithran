-- Add planned start and end dates back to production_lots table
-- This migration re-adds date columns that were removed in migration 101

-- Add date columns to production_lots table
ALTER TABLE production_lots 
ADD COLUMN planned_start_date DATE,
ADD COLUMN planned_end_date DATE;

-- Add comments to document the columns
COMMENT ON COLUMN production_lots.planned_start_date IS 'Planned start date for the production lot';
COMMENT ON COLUMN production_lots.planned_end_date IS 'Planned completion date for the production lot';

-- Create an index for date-based queries
CREATE INDEX idx_production_lots_planned_dates ON production_lots(planned_start_date, planned_end_date);

COMMENT ON SCHEMA public IS 'Re-added planned start and end date columns to production_lots table for scheduling purposes.';