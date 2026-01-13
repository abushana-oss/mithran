-- ============================================================================
-- ADD LOCATION TO PROJECTS
-- ============================================================================
-- Migration: 033_add_location_to_projects.sql
-- Description: Add location fields (country, state, city) to projects table
-- ============================================================================

-- Add location columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add comments for documentation
COMMENT ON COLUMN projects.country IS 'Country where the project is located';
COMMENT ON COLUMN projects.state IS 'State or province where the project is located';
COMMENT ON COLUMN projects.city IS 'City or municipality where the project is located';
