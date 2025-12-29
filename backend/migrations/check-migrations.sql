-- Check which tables exist in the database
-- Run this in Supabase SQL Editor to see what's already been created

-- Check if key tables exist
SELECT
    tablename,
    CASE
        WHEN tablename = 'projects' THEN 'Migration 001'
        WHEN tablename = 'vendors' THEN 'Migration 001'
        WHEN tablename = 'boms' THEN 'Migration 001'
        WHEN tablename = 'bom_items' THEN 'Migration 001'
        WHEN tablename = 'processes' THEN 'Migration 002'
        WHEN tablename = 'machine_hour_rates' THEN 'Migration 002'
        WHEN tablename = 'labor_hour_rates' THEN 'Migration 002'
        WHEN tablename = 'process_routes' THEN 'Migration 011'
        WHEN tablename = 'process_route_steps' THEN 'Migration 011'
        WHEN tablename = 'materials' THEN 'Migration 012'
        ELSE 'Other'
    END as migration_source
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'projects', 'vendors', 'boms', 'bom_items',
        'processes', 'machine_hour_rates', 'labor_hour_rates',
        'process_routes', 'process_route_steps', 'process_templates',
        'materials'
    )
ORDER BY tablename;

-- Check if schema_migrations table exists
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'schema_migrations'
) as schema_migrations_exists;
