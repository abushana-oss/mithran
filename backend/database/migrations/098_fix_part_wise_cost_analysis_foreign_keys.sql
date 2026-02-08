-- Migration 098: Fix Part-wise Cost Analysis Foreign Key References
-- Update foreign key constraints to reference the correct supplier nomination evaluation tables

-- Drop existing foreign key constraints
ALTER TABLE part_wise_cost_analysis 
DROP CONSTRAINT IF EXISTS part_wise_cost_analysis_nomination_id_fkey;

ALTER TABLE part_wise_cost_base_data 
DROP CONSTRAINT IF EXISTS part_wise_cost_base_data_nomination_id_fkey;

-- Update the foreign key to reference supplier_nomination_evaluations instead of supplier_nominations
ALTER TABLE part_wise_cost_analysis 
ADD CONSTRAINT part_wise_cost_analysis_nomination_id_fkey 
FOREIGN KEY (nomination_id) REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE;

ALTER TABLE part_wise_cost_base_data 
ADD CONSTRAINT part_wise_cost_base_data_nomination_id_fkey 
FOREIGN KEY (nomination_id) REFERENCES supplier_nomination_evaluations(id) ON DELETE CASCADE;

-- Update RLS policies to reference the correct table relationships
DROP POLICY IF EXISTS "Users can manage part-wise cost analysis for their nominations" ON part_wise_cost_analysis;
DROP POLICY IF EXISTS "Users can manage part-wise cost base data for their nominations" ON part_wise_cost_base_data;

-- Updated RLS policy for part_wise_cost_analysis
CREATE POLICY "Users can manage part-wise cost analysis for their nominations"
    ON part_wise_cost_analysis FOR ALL
    USING (EXISTS (
        SELECT 1 FROM supplier_nomination_evaluations sne
        JOIN projects p ON p.id = sne.project_id
        WHERE sne.id = part_wise_cost_analysis.nomination_id 
        AND p.user_id = auth.uid()
    ));

-- Updated RLS policy for part_wise_cost_base_data
CREATE POLICY "Users can manage part-wise cost base data for their nominations"
    ON part_wise_cost_base_data FOR ALL
    USING (EXISTS (
        SELECT 1 FROM supplier_nomination_evaluations sne
        JOIN projects p ON p.id = sne.project_id
        WHERE sne.id = part_wise_cost_base_data.nomination_id 
        AND p.user_id = auth.uid()
    ));

-- Add comment about the fix
COMMENT ON CONSTRAINT part_wise_cost_analysis_nomination_id_fkey ON part_wise_cost_analysis 
IS 'References supplier_nomination_evaluations - updated in migration 098';

COMMENT ON CONSTRAINT part_wise_cost_base_data_nomination_id_fkey ON part_wise_cost_base_data 
IS 'References supplier_nomination_evaluations - updated in migration 098';