-- Migration 090: Fix process_id column to be nullable
-- Remove NOT NULL constraint from process_id column if it exists

DO $$
BEGIN
    -- Check if process_id column exists and if it has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'process_id'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop NOT NULL constraint from process_id
        ALTER TABLE production_processes 
        ALTER COLUMN process_id DROP NOT NULL;
        
        RAISE NOTICE 'Removed NOT NULL constraint from process_id column';
    ELSE
        RAISE NOTICE 'process_id column is already nullable or does not exist';
    END IF;
    
    -- Also check and fix depends_on_process_id if it has NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'depends_on_process_id'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop NOT NULL constraint from depends_on_process_id
        ALTER TABLE production_processes 
        ALTER COLUMN depends_on_process_id DROP NOT NULL;
        
        RAISE NOTICE 'Removed NOT NULL constraint from depends_on_process_id column';
    ELSE
        RAISE NOTICE 'depends_on_process_id column is already nullable or does not exist';
    END IF;
END $$;

-- Verify the updated schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'production_processes'
AND column_name IN ('process_id', 'depends_on_process_id')
ORDER BY column_name;