-- =============================================
-- Add BOM Part Support to Remarks System
-- =============================================

-- Add BOM_PART to the applies_to enum
ALTER TABLE remarks_and_issues 
DROP CONSTRAINT IF EXISTS remarks_and_issues_applies_to_check;

ALTER TABLE remarks_and_issues 
ADD CONSTRAINT remarks_and_issues_applies_to_check 
CHECK (applies_to IN ('LOT', 'PROCESS', 'SUBTASK', 'BOM_PART'));

-- Add bom_part_id column to reference BOM parts
ALTER TABLE remarks_and_issues 
ADD COLUMN IF NOT EXISTS bom_part_id UUID;

-- Add foreign key constraint for bom_part_id referencing subtask_bom_requirements
-- This allows remarks to be specific to individual BOM part requirements
ALTER TABLE remarks_and_issues 
ADD CONSTRAINT fk_remarks_bom_part 
FOREIGN KEY (bom_part_id) REFERENCES subtask_bom_requirements(id) ON DELETE SET NULL;

-- Create index for better performance when querying by BOM part
CREATE INDEX IF NOT EXISTS idx_remarks_bom_part_id ON remarks_and_issues(bom_part_id);

-- Create composite index for process + subtask + bom_part queries
CREATE INDEX IF NOT EXISTS idx_remarks_process_subtask_bompart 
ON remarks_and_issues(process_id, subtask_id, bom_part_id);

-- Update the update trigger
CREATE OR REPLACE FUNCTION update_remarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_remarks_modtime ON remarks_and_issues;
CREATE TRIGGER update_remarks_modtime 
    BEFORE UPDATE ON remarks_and_issues 
    FOR EACH ROW EXECUTE FUNCTION update_remarks_updated_at();

-- Add some helpful comments
COMMENT ON COLUMN remarks_and_issues.bom_part_id IS 'Reference to specific BOM part requirement when scope is BOM_PART';
COMMENT ON CONSTRAINT fk_remarks_bom_part ON remarks_and_issues IS 'Links remark to specific BOM part requirement for granular material tracking';