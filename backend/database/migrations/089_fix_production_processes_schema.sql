-- Migration 089: Fix production_processes table schema to match DTO
-- Add missing columns that the backend expects

-- Check current table structure and add missing columns
DO $$
BEGIN
    -- Add quality_check_required column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'quality_check_required'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN quality_check_required BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Added quality_check_required column to production_processes table';
    ELSE
        RAISE NOTICE 'quality_check_required column already exists in production_processes table';
    END IF;

    -- Add assigned_department column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'assigned_department'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN assigned_department VARCHAR(255);
        
        RAISE NOTICE 'Added assigned_department column to production_processes table';
    ELSE
        RAISE NOTICE 'assigned_department column already exists in production_processes table';
    END IF;

    -- Add machine_allocation column if it doesn't exist (for JSON array of machines)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'machine_allocation'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN machine_allocation TEXT[];
        
        RAISE NOTICE 'Added machine_allocation column to production_processes table';
    ELSE
        RAISE NOTICE 'machine_allocation column already exists in production_processes table';
    END IF;

    -- Add depends_on_process_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'depends_on_process_id'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN depends_on_process_id UUID REFERENCES production_processes(id);
        
        RAISE NOTICE 'Added depends_on_process_id column to production_processes table';
    ELSE
        RAISE NOTICE 'depends_on_process_id column already exists in production_processes table';
    END IF;

    -- Add process_id column if it doesn't exist (optional reference to process templates)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'process_id'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN process_id UUID;
        
        RAISE NOTICE 'Added process_id column to production_processes table';
    ELSE
        RAISE NOTICE 'process_id column already exists in production_processes table';
    END IF;

    -- Ensure remarks column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'remarks'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN remarks TEXT;
        
        RAISE NOTICE 'Added remarks column to production_processes table';
    ELSE
        RAISE NOTICE 'remarks column already exists in production_processes table';
    END IF;

    -- Ensure responsible_person column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'production_processes' 
        AND column_name = 'responsible_person'
    ) THEN
        ALTER TABLE production_processes 
        ADD COLUMN responsible_person VARCHAR(255);
        
        RAISE NOTICE 'Added responsible_person column to production_processes table';
    ELSE
        RAISE NOTICE 'responsible_person column already exists in production_processes table';
    END IF;
END $$;

-- Create index for depends_on_process_id foreign key for performance
CREATE INDEX IF NOT EXISTS idx_production_processes_depends_on 
ON production_processes(depends_on_process_id);

-- Create index for process_id for performance
CREATE INDEX IF NOT EXISTS idx_production_processes_process_id 
ON production_processes(process_id);

-- Update existing records to have default values
UPDATE production_processes 
SET quality_check_required = true 
WHERE quality_check_required IS NULL;

-- Verify the updated schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'production_processes'
ORDER BY ordinal_position;

-- Show summary of what was updated
SELECT 
    'production_processes' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN quality_check_required IS NOT NULL THEN 1 END) as records_with_quality_check,
    COUNT(CASE WHEN assigned_department IS NOT NULL THEN 1 END) as records_with_department,
    COUNT(CASE WHEN responsible_person IS NOT NULL THEN 1 END) as records_with_responsible_person
FROM production_processes;