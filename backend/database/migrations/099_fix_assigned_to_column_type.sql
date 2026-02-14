-- Fix assigned_to column type from UUID to VARCHAR(100) to match DTO expectations
-- This addresses the issue where frontend sends user names as strings but database expects UUIDs

ALTER TABLE remarks_and_issues 
ALTER COLUMN assigned_to TYPE VARCHAR(100);

-- Add a comment to clarify the column purpose
COMMENT ON COLUMN remarks_and_issues.assigned_to IS 'User name or identifier for assignment (not UUID reference)';