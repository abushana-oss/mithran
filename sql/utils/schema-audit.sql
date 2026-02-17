-- ================================================================
-- DATABASE SCHEMA AUDIT - PRINCIPAL ENGINEER APPROACH
-- ================================================================
-- This script audits the current database schema to understand
-- the exact state and create proper migrations

-- First, let's see what tables actually exist
SELECT 
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Get actual column structure for each critical table
\echo '=== PROJECTS TABLE STRUCTURE ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'projects'
ORDER BY ordinal_position;

\echo '=== BOMS TABLE STRUCTURE ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'boms'
ORDER BY ordinal_position;

\echo '=== BOM_ITEMS TABLE STRUCTURE ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bom_items'
ORDER BY ordinal_position;

\echo '=== VENDORS TABLE STRUCTURE ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vendors'
ORDER BY ordinal_position;

-- Check existing indexes
\echo '=== EXISTING INDEXES ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check existing constraints
\echo '=== EXISTING CONSTRAINTS ==='
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- Check for any existing migration tracking
\echo '=== MIGRATION TRACKING ==='
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'schema_migrations'
) as migration_table_exists;

-- If migration table exists, show current migrations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schema_migrations') THEN
        RAISE NOTICE 'Current migrations:';
        -- This would show existing migrations if the table exists
    END IF;
END$$;

-- Check table sizes for impact assessment
\echo '=== TABLE SIZES (for migration planning) ==='
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename AND table_schema = schemaname) as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;