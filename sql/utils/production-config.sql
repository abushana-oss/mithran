-- ================================================================
-- PRODUCTION DATABASE CONFIGURATION
-- ================================================================
-- Run these commands on your production Supabase instance
-- These optimize performance, security, and monitoring

-- ================================================================
-- PERFORMANCE OPTIMIZATION
-- ================================================================

-- Connection and memory settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET effective_cache_size = '6GB';

-- WAL and checkpoint optimization
ALTER SYSTEM SET wal_buffers = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET checkpoint_timeout = '15min';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Query optimization
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET default_statistics_target = 500;

-- Enable query performance tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- ================================================================
-- SECURITY HARDENING
-- ================================================================

-- Logging configuration
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Connection security
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_prefer_server_ciphers = on;

-- Row Level Security enforcement
ALTER SYSTEM SET row_security = on;

-- ================================================================
-- MONITORING SETUP
-- ================================================================

-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Query performance monitoring
CREATE OR REPLACE VIEW monitoring.slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- Active connections monitoring
CREATE OR REPLACE VIEW monitoring.active_connections AS
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start as query_duration,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Table size monitoring
CREATE OR REPLACE VIEW monitoring.table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage monitoring
CREATE OR REPLACE VIEW monitoring.index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- ================================================================
-- AUTOMATED MAINTENANCE
-- ================================================================

-- Auto-vacuum configuration
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;
ALTER SYSTEM SET autovacuum_work_mem = '1GB';

-- Create maintenance function for materialized views
CREATE OR REPLACE FUNCTION monitoring.refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', r.schemaname, r.matviewname);
    END LOOP;
END;
$$;

-- ================================================================
-- BACKUP VERIFICATION
-- ================================================================

-- Create backup monitoring table
CREATE TABLE IF NOT EXISTS monitoring.backup_status (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    backup_size_bytes BIGINT,
    backup_duration_seconds INTEGER,
    backup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Function to log backup status
CREATE OR REPLACE FUNCTION monitoring.log_backup(
    p_backup_type VARCHAR(50),
    p_size_bytes BIGINT DEFAULT NULL,
    p_duration_seconds INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO monitoring.backup_status (
        backup_type, backup_size_bytes, backup_duration_seconds, 
        success, error_message
    ) VALUES (
        p_backup_type, p_size_bytes, p_duration_seconds, 
        p_success, p_error_message
    );
END;
$$;

-- ================================================================
-- PERFORMANCE ALERTS
-- ================================================================

-- Function to check system health
CREATE OR REPLACE FUNCTION monitoring.system_health_check()
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check for slow queries
    RETURN QUERY
    SELECT 
        'Slow Queries'::VARCHAR(100),
        CASE WHEN COUNT(*) > 10 THEN 'WARNING' ELSE 'OK' END::VARCHAR(20),
        'Found ' || COUNT(*)::TEXT || ' queries slower than 1 second'::TEXT
    FROM pg_stat_statements
    WHERE mean_time > 1000;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Connection Count'::VARCHAR(100),
        CASE WHEN COUNT(*) > 80 THEN 'WARNING' ELSE 'OK' END::VARCHAR(20),
        'Active connections: ' || COUNT(*)::TEXT || '/100'::TEXT
    FROM pg_stat_activity
    WHERE state != 'idle';
    
    -- Check database size
    RETURN QUERY
    SELECT 
        'Database Size'::VARCHAR(100),
        CASE WHEN pg_database_size(current_database()) > 50*1024*1024*1024 THEN 'WARNING' ELSE 'OK' END::VARCHAR(20),
        'Database size: ' || pg_size_pretty(pg_database_size(current_database()))::TEXT
    FROM pg_database
    WHERE datname = current_database();
END;
$$;

-- ================================================================
-- DEPLOYMENT CHECKLIST
-- ================================================================

/*
PRODUCTION DEPLOYMENT CHECKLIST:

1. DATABASE SETUP:
   □ Run consolidated schema migration (000_consolidated_production_schema.sql)
   □ Apply production configuration (this file)
   □ Restart database to apply system settings
   □ Verify all indexes are created
   □ Test materialized view refresh

2. SECURITY:
   □ Rotate all Supabase credentials
   □ Set up proper RLS policies
   □ Configure SSL certificates
   □ Set up connection pooling with PgBouncer
   □ Restrict database access to application servers only

3. PERFORMANCE:
   □ Run ANALYZE on all tables
   □ Set up monitoring dashboards
   □ Configure automated backups
   □ Test query performance under load
   □ Set up materialized view refresh schedule (every 4 hours)

4. MONITORING:
   □ Set up alerts for slow queries
   □ Monitor connection count
   □ Track database size growth
   □ Set up backup verification
   □ Configure log rotation

5. MAINTENANCE:
   □ Schedule weekly VACUUM ANALYZE
   □ Set up automated statistics collection
   □ Plan for index maintenance
   □ Configure archive log cleanup

RECOMMENDED CRON JOBS:
-- Materialized view refresh: 0 */4 * * *
-- System health check: */15 * * * *
-- Backup verification: 0 2 * * *
-- Statistics update: 0 1 * * 0

*/