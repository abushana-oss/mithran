-- Migration: Make processes.user_id nullable for system processes
-- Description: Allow system/template processes to exist without a specific user
-- Author: System
-- Date: 2026-01-04

-- ============================================================================
-- ALTER PROCESSES TABLE
-- ============================================================================

-- Make user_id nullable for system/template processes
ALTER TABLE processes
ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment
COMMENT ON COLUMN processes.user_id IS 'User who created the process. NULL for system/template processes.';
