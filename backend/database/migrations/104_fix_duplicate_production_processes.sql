-- ============================================================================
-- MIGRATION 104: Fix Duplicate Production Processes
-- ============================================================================
-- This migration cleans up duplicate production processes and ensures each
-- production lot has exactly 4 standard processes:
-- 1. Raw Material
-- 2. Process Conversion  
-- 3. Inspection
-- 4. Packing
-- ============================================================================

DO $$
DECLARE
    lot_record RECORD;
    process_count INTEGER;
    lot_start_date DATE;
    lot_end_date DATE;
    process_duration INTERVAL;
BEGIN
    RAISE NOTICE 'Starting production processes cleanup...';
    
    -- Loop through all production lots
    FOR lot_record IN 
        SELECT id, planned_start_date, planned_end_date, lot_number
        FROM production_lots 
        ORDER BY created_at
    LOOP
        RAISE NOTICE 'Processing lot: % (ID: %)', lot_record.lot_number, lot_record.id;
        
        -- Count existing processes for this lot
        SELECT COUNT(*) INTO process_count 
        FROM production_processes 
        WHERE production_lot_id = lot_record.id;
        
        RAISE NOTICE 'Found % existing processes for lot %', process_count, lot_record.lot_number;
        
        -- Delete all existing processes for this lot (we'll recreate them)
        DELETE FROM production_processes 
        WHERE production_lot_id = lot_record.id;
        
        RAISE NOTICE 'Deleted existing processes for lot %', lot_record.lot_number;
        
        -- Calculate timeline for processes
        lot_start_date := lot_record.planned_start_date;
        lot_end_date := lot_record.planned_end_date;
        process_duration := (lot_end_date - lot_start_date) / 4;
        
        -- Create the 4 standard processes
        INSERT INTO production_processes (
            production_lot_id,
            process_id,
            process_sequence,
            process_name,
            description,
            planned_start_date,
            planned_end_date,
            status,
            completion_percentage,
            quality_check_required,
            quality_status
        ) VALUES
        -- 1. Raw Material
        (
            lot_record.id,
            'default-raw-material',
            1,
            'Raw Material',
            'Raw material procurement, inspection, and preparation for production',
            lot_start_date::timestamp with time zone,
            (lot_start_date + process_duration)::timestamp with time zone,
            'pending',
            0,
            true,
            'pending'
        ),
        -- 2. Process Conversion
        (
            lot_record.id,
            'default-process-conversion',
            2,
            'Process Conversion',
            'Core manufacturing and processing operations',
            (lot_start_date + process_duration)::timestamp with time zone,
            (lot_start_date + process_duration * 2)::timestamp with time zone,
            'pending',
            0,
            true,
            'pending'
        ),
        -- 3. Inspection
        (
            lot_record.id,
            'default-inspection',
            3,
            'Inspection',
            'Quality inspection, testing, and validation processes',
            (lot_start_date + process_duration * 2)::timestamp with time zone,
            (lot_start_date + process_duration * 3)::timestamp with time zone,
            'pending',
            0,
            true,
            'pending'
        ),
        -- 4. Packing
        (
            lot_record.id,
            'default-packing',
            4,
            'Packing',
            'Final packaging, labeling, and preparation for delivery',
            (lot_start_date + process_duration * 3)::timestamp with time zone,
            lot_end_date::timestamp with time zone,
            'pending',
            0,
            true,
            'pending'
        );
        
        RAISE NOTICE 'Created 4 standard processes for lot %', lot_record.lot_number;
        
    END LOOP;
    
    -- Verify the cleanup
    SELECT COUNT(*) INTO process_count FROM production_processes;
    RAISE NOTICE 'Total processes after cleanup: %', process_count;
    
    -- Show summary by process name
    FOR lot_record IN 
        SELECT process_name, COUNT(*) as count
        FROM production_processes 
        GROUP BY process_name 
        ORDER BY process_name
    LOOP
        RAISE NOTICE 'Process "%" has % instances', lot_record.process_name, lot_record.count;
    END LOOP;
    
    RAISE NOTICE 'Production processes cleanup completed successfully!';
    
END $$;