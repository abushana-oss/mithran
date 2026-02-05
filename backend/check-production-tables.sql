-- Check if production planning tables exist
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'production_lots',
    'lot_vendor_assignments', 
    'production_processes',
    'process_subtasks',
    'daily_production_entries',
    'production_schedules'
  )
ORDER BY table_name;

-- If no tables are returned, you need to run the migration:
-- psql -d your_database -f migrations/065_production_planning_system.sql