-- Check if raw_materials table exists and view its structure
-- Run this in Supabase SQL Editor

-- 1. Check if raw_materials table exists
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'raw_materials'
) as raw_materials_table_exists;

-- 2. If it exists, show column information
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'raw_materials'
ORDER BY ordinal_position;

-- 3. Check indexes on the table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'raw_materials'
ORDER BY indexname;

-- 4. Check RLS policies
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'raw_materials'
ORDER BY policyname;

-- 5. Count existing records (if table exists)
SELECT COUNT(*) as total_records
FROM raw_materials;

-- 6. Show sample records (if any exist)
SELECT *
FROM raw_materials
LIMIT 5;
