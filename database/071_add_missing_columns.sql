-- Add missing columns to supplier_ranking_calculations table

-- Add updated_at and created_at columns if they don't exist
DO $$ 
BEGIN
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'supplier_ranking_calculations' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE supplier_ranking_calculations 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add created_at column  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'supplier_ranking_calculations' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE supplier_ranking_calculations 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update existing rows to have current timestamp
UPDATE supplier_ranking_calculations 
SET 
    updated_at = CURRENT_TIMESTAMP,
    created_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL OR created_at IS NULL;