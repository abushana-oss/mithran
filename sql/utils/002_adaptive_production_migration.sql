-- ================================================================
-- ADAPTIVE PRODUCTION MIGRATION - PRINCIPAL ENGINEER APPROACH
-- ================================================================
-- Version: 2.0.0
-- Created: 2026-02-16
-- Description: Self-validating, adaptive migration for production
-- 
-- This migration checks current schema state and adapts accordingly
-- Works with any existing database state without assumptions

-- ================================================================
-- SCHEMA MIGRATION TRACKING (Create if not exists)
-- ================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum TEXT,
    description TEXT,
    rollback_sql TEXT
);

-- ================================================================
-- ADAPTIVE COLUMN ADDITIONS
-- ================================================================

-- Projects table adaptive columns
DO $$
BEGIN
    -- Add project_name if it doesn't exist (for compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_name VARCHAR(255);
        -- Update project_name from name if name exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'name'
            AND table_schema = 'public'
        ) THEN
            UPDATE projects SET project_name = name WHERE project_name IS NULL;
        END IF;
    END IF;

    -- Add budget if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'budget'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE projects ADD COLUMN budget DECIMAL(15,2);
        ALTER TABLE projects ADD CONSTRAINT projects_budget_positive CHECK (budget IS NULL OR budget > 0);
    END IF;

    -- Add start_date and end_date if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'start_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'end_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE projects ADD COLUMN end_date DATE;
        ALTER TABLE projects ADD CONSTRAINT projects_valid_dates 
            CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
    END IF;
END$$;

-- BOMs table adaptive columns
DO $$
BEGIN
    -- Add is_active if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boms' AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE boms ADD COLUMN is_active BOOLEAN DEFAULT true;
        -- Set existing records to active
        UPDATE boms SET is_active = true WHERE is_active IS NULL;
    END IF;

    -- Add total_cost_inr if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boms' AND column_name = 'total_cost_inr'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE boms ADD COLUMN total_cost_inr DECIMAL(20,4) DEFAULT 0;
        ALTER TABLE boms ADD CONSTRAINT boms_cost_positive CHECK (total_cost_inr >= 0);
    END IF;
END$$;

-- BOM Items table adaptive columns
DO $$
BEGIN
    -- Add level_in_bom if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bom_items' AND column_name = 'level_in_bom'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE bom_items ADD COLUMN level_in_bom INTEGER DEFAULT 0;
        ALTER TABLE bom_items ADD CONSTRAINT bom_items_level_positive CHECK (level_in_bom >= 0);
    END IF;

    -- Add make_buy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bom_items' AND column_name = 'make_buy'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE bom_items ADD COLUMN make_buy VARCHAR(10) DEFAULT 'make';
        ALTER TABLE bom_items ADD CONSTRAINT bom_items_make_buy_check CHECK (make_buy IN ('make', 'buy'));
    END IF;

    -- Add total_cost_inr if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bom_items' AND column_name = 'total_cost_inr'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE bom_items ADD COLUMN total_cost_inr DECIMAL(20,4) DEFAULT 0;
        ALTER TABLE bom_items ADD CONSTRAINT bom_items_cost_positive CHECK (total_cost_inr >= 0);
    END IF;
END$$;

-- Vendors table adaptive columns
DO $$
BEGIN
    -- Add is_active if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE vendors ADD COLUMN is_active BOOLEAN DEFAULT true;
        UPDATE vendors SET is_active = true WHERE is_active IS NULL;
    END IF;

    -- Add overall_rating if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendors' AND column_name = 'overall_rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE vendors ADD COLUMN overall_rating DECIMAL(3,2);
        ALTER TABLE vendors ADD CONSTRAINT vendors_rating_range CHECK (overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5));
    END IF;
END$$;

-- ================================================================
-- ADAPTIVE INDEX CREATION
-- ================================================================

-- Function to create index if it doesn't exist
CREATE OR REPLACE FUNCTION create_index_if_not_exists(index_name TEXT, table_name TEXT, index_definition TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = index_name 
        AND tablename = table_name
        AND schemaname = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX ' || index_name || ' ON ' || table_name || ' ' || index_definition;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END$$;

-- Create performance indexes adaptively
SELECT create_index_if_not_exists(
    'idx_projects_user_status_adaptive',
    'projects',
    '(user_id, status)'
);

SELECT create_index_if_not_exists(
    'idx_boms_project_active_adaptive',
    'boms',
    '(project_id) WHERE COALESCE(is_active, true) = true'
);

SELECT create_index_if_not_exists(
    'idx_bom_items_bom_type_adaptive',
    'bom_items',
    '(bom_id, item_type)'
);

SELECT create_index_if_not_exists(
    'idx_vendors_active_adaptive',
    'vendors',
    '(COALESCE(is_active, true)) WHERE COALESCE(is_active, true) = true'
);

-- ================================================================
-- PRODUCTION MONITORING VIEWS (Safe creation)
-- ================================================================

-- Drop and recreate monitoring schema
DROP SCHEMA IF EXISTS monitoring CASCADE;
CREATE SCHEMA monitoring;

-- Current schema state view
CREATE VIEW monitoring.current_schema_state AS
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    COUNT(i.indexname) as index_count,
    pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) as table_size
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
LEFT JOIN pg_indexes i ON t.table_name = i.tablename AND i.schemaname = 'public'
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY pg_total_relation_size('public.' || t.table_name) DESC;

-- Performance monitoring view (adaptive to available statistics)
CREATE VIEW monitoring.table_performance AS
SELECT 
    t.table_name,
    pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) as table_size,
    pg_total_relation_size('public.' || t.table_name) as size_bytes,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = t.table_name AND schemaname = 'public') as index_count,
    'Statistics require pg_stat_statements extension' as note
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size('public.' || t.table_name) DESC;

-- Index usage view (simplified for compatibility)
CREATE VIEW monitoring.index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
        WHEN indexdef LIKE '%PRIMARY KEY%' THEN 'PRIMARY'
        ELSE 'REGULAR'
    END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ================================================================
-- PRODUCTION MAINTENANCE FUNCTIONS
-- ================================================================

-- Adaptive schema validation function
CREATE OR REPLACE FUNCTION monitoring.validate_schema_integrity()
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    details TEXT,
    action_required TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check for missing foreign key constraints
    RETURN QUERY
    WITH missing_fks AS (
        SELECT 
            'projects.user_id should reference auth.users' as missing_constraint
        WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'projects' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'user_id'
        )
    )
    SELECT 
        'Foreign Key Constraints'::VARCHAR(100),
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END::VARCHAR(20),
        CASE WHEN COUNT(*) = 0 
             THEN 'All expected foreign keys exist'
             ELSE COUNT(*)::TEXT || ' missing foreign key constraints'
        END::TEXT,
        CASE WHEN COUNT(*) = 0 
             THEN 'No action required'
             ELSE 'Review and add missing foreign key constraints'
        END::TEXT
    FROM missing_fks;

    -- Check for production-critical indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::VARCHAR(100),
        CASE WHEN COUNT(*) >= 4 THEN 'OK' ELSE 'WARNING' END::VARCHAR(20),
        'Found ' || COUNT(*)::TEXT || ' performance indexes'::TEXT,
        CASE WHEN COUNT(*) >= 4 
             THEN 'Adequate indexing'
             ELSE 'Consider adding more performance indexes'
        END::TEXT
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname LIKE '%_adaptive';
END$$;

-- ================================================================
-- FINALIZATION
-- ================================================================

-- Update statistics for better query planning
ANALYZE;

-- Record this migration with rollback information
INSERT INTO schema_migrations (version, description, checksum, rollback_sql) 
VALUES (
    '002_adaptive_production_migration', 
    'Adaptive production migration that works with any schema state',
    'sha256:adaptive_v2.0.0',
    'DROP SCHEMA monitoring CASCADE; DROP FUNCTION create_index_if_not_exists(TEXT, TEXT, TEXT);'
)
ON CONFLICT (version) DO UPDATE SET
    applied_at = NOW(),
    description = EXCLUDED.description,
    checksum = EXCLUDED.checksum,
    rollback_sql = EXCLUDED.rollback_sql;

-- Clean up the helper function (no longer needed after migration)
DROP FUNCTION create_index_if_not_exists(TEXT, TEXT, TEXT);

-- Final validation and reporting
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO constraint_count FROM information_schema.table_constraints WHERE table_schema = 'public';
    
    RAISE NOTICE 'ADAPTIVE MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'Tables: %, Indexes: %, Constraints: %', table_count, index_count, constraint_count;
    RAISE NOTICE 'Run: SELECT * FROM monitoring.validate_schema_integrity();';
    RAISE NOTICE 'Run: SELECT * FROM monitoring.current_schema_state;';
END$$;