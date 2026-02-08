-- Check existing table structures to understand what columns exist

-- 1. Check production_lots table structure
SELECT 
    'production_lots' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'production_lots'
ORDER BY ordinal_position;

-- 2. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('production_lots', 'lot_vendor_assignments', 'production_processes')
ORDER BY table_name;

-- 3. Check existing constraints
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('production_lots', 'lot_vendor_assignments', 'production_processes')
ORDER BY table_name, constraint_name;