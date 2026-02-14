-- Remove all date columns from production planning tables
-- This migration removes planned_start_date, planned_end_date, start_date, end_date columns

-- First, drop dependent views and objects that reference date columns
DROP VIEW IF EXISTS production_schedule_view CASCADE;
DROP VIEW IF EXISTS production_timeline_view CASCADE;
DROP VIEW IF EXISTS process_gantt_view CASCADE;
DROP VIEW IF EXISTS weekly_production_summary CASCADE;
DROP VIEW IF EXISTS production_lot_summary CASCADE;
DROP VIEW IF EXISTS lot_timeline_view CASCADE;
DROP VIEW IF EXISTS production_dashboard_view CASCADE;
DROP VIEW IF EXISTS process_dependency_view CASCADE;
DROP VIEW IF EXISTS production_metrics_view CASCADE;

-- Drop any functions that might depend on date columns
DROP FUNCTION IF EXISTS get_weekly_production_summary CASCADE;
DROP FUNCTION IF EXISTS calculate_production_timeline CASCADE;
DROP FUNCTION IF EXISTS get_lot_progress CASCADE;

-- Remove date columns from production_processes table
DO $$
BEGIN
    -- Check and drop columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_processes' AND column_name = 'planned_start_date') THEN
        ALTER TABLE production_processes DROP COLUMN planned_start_date CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_processes' AND column_name = 'planned_end_date') THEN
        ALTER TABLE production_processes DROP COLUMN planned_end_date CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_processes' AND column_name = 'start_date') THEN
        ALTER TABLE production_processes DROP COLUMN start_date CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_processes' AND column_name = 'end_date') THEN
        ALTER TABLE production_processes DROP COLUMN end_date CASCADE;
    END IF;
END $$;

-- Remove date columns from subtask_with_bom_parts table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subtask_with_bom_parts' AND column_name = 'planned_start_date') THEN
        ALTER TABLE subtask_with_bom_parts DROP COLUMN planned_start_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subtask_with_bom_parts' AND column_name = 'planned_end_date') THEN
        ALTER TABLE subtask_with_bom_parts DROP COLUMN planned_end_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subtask_with_bom_parts' AND column_name = 'start_time') THEN
        ALTER TABLE subtask_with_bom_parts DROP COLUMN start_time;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subtask_with_bom_parts' AND column_name = 'end_time') THEN
        ALTER TABLE subtask_with_bom_parts DROP COLUMN end_time;
    END IF;
END $$;

-- Remove date columns from production_lots table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_lots' AND column_name = 'planned_start_date') THEN
        ALTER TABLE production_lots DROP COLUMN planned_start_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_lots' AND column_name = 'planned_end_date') THEN
        ALTER TABLE production_lots DROP COLUMN planned_end_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_lots' AND column_name = 'actual_start_date') THEN
        ALTER TABLE production_lots DROP COLUMN actual_start_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_lots' AND column_name = 'actual_end_date') THEN
        ALTER TABLE production_lots DROP COLUMN actual_end_date;
    END IF;
END $$;

-- Remove date columns from production_entries table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_entries' AND column_name = 'entry_date') THEN
        ALTER TABLE production_entries DROP COLUMN entry_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'production_entries' AND column_name = 'planned_date') THEN
        ALTER TABLE production_entries DROP COLUMN planned_date;
    END IF;
END $$;

COMMENT ON SCHEMA public IS 'All date-related columns have been removed from production planning tables to simplify the system. Only estimated and actual hours are retained for duration tracking.';