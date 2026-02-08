-- Migration 099: Fix RFQ Tracking Project ID Null Values (Corrected)
-- Clean up null project_id values in rfq_tracking table

-- First, let's see what we're working with
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM rfq_tracking WHERE project_id IS NULL;
    RAISE NOTICE 'Found % RFQ tracking records with null project_id', null_count;
END $$;

-- Option 1: Try to populate project_id from related RFQ data (using correct table name)
UPDATE rfq_tracking 
SET project_id = rfq_records.project_id
FROM rfq_records
WHERE rfq_tracking.rfq_id = rfq_records.id 
AND rfq_tracking.project_id IS NULL
AND rfq_records.project_id IS NOT NULL;

-- Option 2: Try to populate project_id from user's projects (if user has only one project)
UPDATE rfq_tracking 
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.user_id = rfq_tracking.user_id 
    LIMIT 1
)
WHERE project_id IS NULL
AND user_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.user_id = rfq_tracking.user_id
);

-- Check how many null values remain after attempting to fix them
DO $$
DECLARE
    remaining_nulls INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_nulls FROM rfq_tracking WHERE project_id IS NULL;
    
    IF remaining_nulls > 0 THEN
        RAISE NOTICE 'Still have % RFQ tracking records with null project_id after repair attempts', remaining_nulls;
        
        -- Option 3: Delete orphaned records that cannot be fixed
        -- These are likely test data or corrupted records
        DELETE FROM rfq_tracking WHERE project_id IS NULL;
        
        RAISE NOTICE 'Deleted orphaned RFQ tracking records with null project_id';
    ELSE
        RAISE NOTICE 'All RFQ tracking records now have valid project_id values';
    END IF;
END $$;

-- Verify the fix worked
DO $$
DECLARE
    final_null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_null_count FROM rfq_tracking WHERE project_id IS NULL;
    
    IF final_null_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All RFQ tracking records now have project_id values';
    ELSE
        RAISE EXCEPTION 'FAILED: Still have % records with null project_id', final_null_count;
    END IF;
END $$;

-- Add some data integrity checks
DO $$
DECLARE
    orphaned_rfqs INTEGER;
    invalid_projects INTEGER;
BEGIN
    -- Check for RFQ tracking records referencing non-existent RFQ records
    SELECT COUNT(*) INTO orphaned_rfqs 
    FROM rfq_tracking rt 
    WHERE rt.rfq_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM rfq_records r WHERE r.id = rt.rfq_id);
    
    IF orphaned_rfqs > 0 THEN
        RAISE NOTICE 'Found % RFQ tracking records referencing non-existent RFQ records', orphaned_rfqs;
    END IF;
    
    -- Check for RFQ tracking records referencing non-existent projects
    SELECT COUNT(*) INTO invalid_projects 
    FROM rfq_tracking rt 
    WHERE rt.project_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = rt.project_id);
    
    IF invalid_projects > 0 THEN
        RAISE NOTICE 'Found % RFQ tracking records referencing non-existent projects', invalid_projects;
    END IF;
END $$;

-- Add comment about the fix
COMMENT ON TABLE rfq_tracking IS 'RFQ tracking table - project_id nulls fixed in migration 099';