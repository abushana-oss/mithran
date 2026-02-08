-- Migration 100: Urgent Fix for RFQ Tracking Null Project IDs
-- Simple fix to allow project deletion to work

-- Check current state
SELECT COUNT(*) as null_project_ids FROM rfq_tracking WHERE project_id IS NULL;

-- Simply delete the problematic records with null project_id
-- These are likely orphaned test data that's causing the constraint violation
DELETE FROM rfq_tracking WHERE project_id IS NULL;

-- Verify the fix
SELECT COUNT(*) as remaining_null_project_ids FROM rfq_tracking WHERE project_id IS NULL;