-- Clean all mock vendor data and ensure only real user-selected vendors appear
-- Principal Engineer Best Practice: Clean database schema with proper constraints

-- 1. Remove all mock vendor data
DELETE FROM vendor_evaluation_scores;
DELETE FROM vendor_nomination_evaluations 
WHERE vendor_id IN (
    SELECT id FROM vendors 
    WHERE name IN ('PROTON METALCRAFTS PVT.LTD.', 'Sunrise Technologies', 'Abhi Metals', 'ALPHA PRECISION INC.')
);

-- 2. Remove mock vendors from vendors table
DELETE FROM vendors 
WHERE name IN ('PROTON METALCRAFTS PVT.LTD.', 'Sunrise Technologies', 'Abhi Metals', 'ALPHA PRECISION INC.')
   OR name LIKE '%mock%' 
   OR name LIKE '%test%' 
   OR name LIKE '%sample%';

-- 3. Clean up any orphaned evaluation data
DELETE FROM supplier_ranking_calculations 
WHERE nomination_evaluation_id NOT IN (
    SELECT DISTINCT nomination_evaluation_id FROM vendor_nomination_evaluations
);

DELETE FROM ranking_factor_weights 
WHERE nomination_evaluation_id NOT IN (
    SELECT id FROM supplier_nomination_evaluations
);

DELETE FROM evaluation_sections 
WHERE nomination_evaluation_id NOT IN (
    SELECT id FROM supplier_nomination_evaluations
)
OR vendor_id NOT IN (
    SELECT id FROM vendors
);

-- 4. Reset all evaluation scores to ensure clean state
UPDATE vendor_nomination_evaluations 
SET 
    overall_score = 0,
    capability_percentage = 0,
    risk_mitigation_percentage = 0,
    technical_feasibility_score = 0,
    major_nc_count = 0,
    minor_nc_count = 0,
    evaluation_notes = NULL,
    technical_discussion = NULL,
    recommendation = 'pending',
    cost_analysis = '{}',
    rating_engine = '{}',
    technical_assessment = '{}'
WHERE overall_score > 0 OR capability_percentage > 0;

-- 5. Ensure proper foreign key constraints for data integrity
ALTER TABLE vendor_nomination_evaluations 
DROP CONSTRAINT IF EXISTS fk_vendor_nomination_evaluations_vendor;

ALTER TABLE vendor_nomination_evaluations 
ADD CONSTRAINT fk_vendor_nomination_evaluations_vendor 
FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

-- 6. Add indexes for better performance on vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_nomination_evaluations_vendor_id 
ON vendor_nomination_evaluations(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendors_name 
ON vendors(name);

CREATE INDEX IF NOT EXISTS idx_vendors_created_at 
ON vendors(created_at);

-- 7. Add constraint to prevent duplicate vendor evaluations in same nomination
ALTER TABLE vendor_nomination_evaluations 
DROP CONSTRAINT IF EXISTS unique_vendor_per_nomination;

ALTER TABLE vendor_nomination_evaluations 
ADD CONSTRAINT unique_vendor_per_nomination 
UNIQUE(nomination_evaluation_id, vendor_id);

-- Success confirmation
SELECT 
    'Database cleaned successfully' as status,
    COUNT(*) as remaining_vendors 
FROM vendors;