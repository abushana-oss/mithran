-- Cleanup script for test tables and unwanted objects
-- Run this in Supabase SQL Editor to clean up test tables

-- Drop test tables if they exist (safe approach)
DO $$ 
BEGIN
    -- Drop test table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_nominations_test') THEN
        DROP TABLE supplier_nominations_test CASCADE;
        RAISE NOTICE 'Dropped table: supplier_nominations_test';
    END IF;

    -- Drop old nomination_criteria if it exists (not our new one)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'nomination_criteria'
        AND table_name NOT IN (SELECT table_name FROM information_schema.tables WHERE table_name = 'nomination_evaluation_criteria')
    ) THEN
        DROP TABLE nomination_criteria CASCADE;
        RAISE NOTICE 'Dropped table: nomination_criteria';
    END IF;

    -- Drop old vendor_evaluations if it exists (not our new one)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_evaluations'
        AND table_name NOT IN (SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_nomination_evaluations')
    ) THEN
        DROP TABLE vendor_evaluations CASCADE;
        RAISE NOTICE 'Dropped table: vendor_evaluations';
    END IF;

    -- Drop old evaluation_scores if it exists (not our new one)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluation_scores'
        AND table_name NOT IN (SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_evaluation_scores')
    ) THEN
        DROP TABLE evaluation_scores CASCADE;
        RAISE NOTICE 'Dropped table: evaluation_scores';
    END IF;
END $$;

-- Drop any test functions if they exist
DO $$
BEGIN
    -- Drop old update function if it exists
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_vendor_evaluation_score' AND routine_type = 'FUNCTION') THEN
        DROP FUNCTION update_vendor_evaluation_score() CASCADE;
        RAISE NOTICE 'Dropped function: update_vendor_evaluation_score';
    END IF;

    -- Drop old initialize function if it exists  
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'initialize_nomination_criteria' AND routine_type = 'FUNCTION') THEN
        DROP FUNCTION initialize_nomination_criteria(UUID, VARCHAR) CASCADE;
        RAISE NOTICE 'Dropped function: initialize_nomination_criteria';
    END IF;

    -- Drop test function if it exists
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'test_function' AND routine_type = 'FUNCTION') THEN
        DROP FUNCTION test_function() CASCADE;
        RAISE NOTICE 'Dropped function: test_function';
    END IF;
END $$;

-- Drop any test indexes if they exist
DROP INDEX IF EXISTS idx_test_user_project;

-- Clean up any orphaned constraints (these table names were from our failed attempts)
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Find and drop any constraints related to our old table names
    FOR constraint_rec IN 
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%fk_%' 
        AND table_name IN ('nomination_criteria', 'vendor_evaluations', 'evaluation_scores')
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_rec.table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name || ' CASCADE';
    END LOOP;
END $$;

-- Verify cleanup - show remaining supplier nomination related tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE '%supplier%nomination%' 
   OR table_name LIKE '%nomination%' 
   OR table_name LIKE '%evaluation%'
ORDER BY table_name;

-- Show what we should have after cleanup:
-- 1. supplier_nominations (original simple table from migration 002)
-- 2. supplier_nomination_evaluations (our new comprehensive table)
-- 3. nomination_evaluation_criteria (our new criteria table)
-- 4. vendor_nomination_evaluations (our new vendor evaluations)
-- 5. vendor_evaluation_scores (our new scoring table)