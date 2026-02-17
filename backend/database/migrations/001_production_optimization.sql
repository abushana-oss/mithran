-- ================================================================
-- PRODUCTION OPTIMIZATION MIGRATION
-- ================================================================
-- Version: 1.0.0
-- Created: 2026-02-16
-- Description: Safe production optimizations for existing database
-- 
-- This migration adds production optimizations without breaking
-- existing data or functionality

-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================================================
-- SCHEMA MIGRATION TRACKING
-- ================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum TEXT,
    description TEXT
);

-- ================================================================
-- PRODUCTION-READY INDEXES (Add if not exists)
-- ================================================================

-- Projects performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_status_perf 
ON projects(user_id, status) WHERE status IN ('active', 'draft');

CREATE INDEX IF NOT EXISTS idx_projects_organization_status 
ON projects(organization_id, status) WHERE organization_id IS NOT NULL;

-- BOMs performance indexes  
CREATE INDEX IF NOT EXISTS idx_boms_project_status 
ON boms(project_id, status) WHERE status != 'obsolete';

CREATE INDEX IF NOT EXISTS idx_boms_user_active 
ON boms(user_id) WHERE status IN ('approved', 'released');

-- BOM Items performance indexes
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_type 
ON bom_items(bom_id, item_type) WHERE item_type != 'bop';

CREATE INDEX IF NOT EXISTS idx_bom_items_parent_level 
ON bom_items(parent_item_id, level_in_bom) WHERE parent_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bom_items_cost_analysis 
ON bom_items(bom_id, make_buy, total_cost_inr) WHERE total_cost_inr > 0;

-- Vendors performance indexes
CREATE INDEX IF NOT EXISTS idx_vendors_active_rating_perf 
ON vendors(is_active, overall_rating DESC NULLS LAST) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vendors_location_perf 
ON vendors(country, state, city) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vendors_supplier_code 
ON vendors(supplier_code) WHERE supplier_code IS NOT NULL;

-- ================================================================
-- MATERIALIZED VIEWS FOR REPORTING
-- ================================================================

-- Vendor performance summary (safe creation)
DROP MATERIALIZED VIEW IF EXISTS vendor_performance_summary CASCADE;
CREATE MATERIALIZED VIEW vendor_performance_summary AS
SELECT 
    v.id,
    COALESCE(v.company_name, v.name) as company_name,
    v.supplier_code,
    v.status,
    v.overall_rating,
    COUNT(vr.id) as total_ratings,
    AVG(vr.overall_rating) as avg_rating_from_reviews,
    COUNT(CASE WHEN vr.created_at >= NOW() - INTERVAL '6 months' THEN 1 END) as recent_ratings,
    MAX(vr.created_at) as last_rated,
    v.created_at,
    v.updated_at
FROM vendors v
LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
WHERE v.is_active = true
GROUP BY v.id, v.company_name, v.name, v.supplier_code, v.status, v.overall_rating, v.created_at, v.updated_at;

CREATE UNIQUE INDEX idx_vendor_performance_summary_id 
ON vendor_performance_summary(id);

-- Project cost summary (safe creation)  
DROP MATERIALIZED VIEW IF EXISTS project_cost_summary CASCADE;
CREATE MATERIALIZED VIEW project_cost_summary AS
SELECT 
    p.id as project_id,
    COALESCE(p.project_name, p.name) as project_name,
    p.status,
    p.user_id,
    COUNT(b.id) as total_boms,
    SUM(COALESCE(b.total_cost_inr, b.total_cost, 0)) as total_project_cost_inr,
    AVG(COALESCE(b.total_cost_inr, b.total_cost, 0)) as avg_bom_cost_inr,
    COUNT(bi.id) as total_bom_items,
    SUM(CASE WHEN bi.make_buy = 'make' THEN bi.total_cost_inr ELSE 0 END) as make_cost_inr,
    SUM(CASE WHEN bi.make_buy = 'buy' THEN bi.total_cost_inr ELSE 0 END) as buy_cost_inr,
    MAX(b.updated_at) as last_updated,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN boms b ON p.id = b.project_id AND (b.is_active = true OR b.status = 'approved')
LEFT JOIN bom_items bi ON b.id = bi.bom_id
WHERE p.status IN ('active', 'draft')
GROUP BY p.id, p.project_name, p.name, p.status, p.user_id, p.created_at, p.updated_at;

CREATE UNIQUE INDEX idx_project_cost_summary_id 
ON project_cost_summary(project_id);

-- ================================================================
-- PRODUCTION MAINTENANCE FUNCTIONS
-- ================================================================

-- Optimized function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_production_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := NOW();
    
    -- Refresh vendor performance summary
    REFRESH MATERIALIZED VIEW vendor_performance_summary;
    
    -- Refresh project cost summary
    REFRESH MATERIALIZED VIEW project_cost_summary;
    
    end_time := NOW();
    
    -- Log refresh completion
    RAISE NOTICE 'Materialized views refreshed in % seconds', 
        EXTRACT(EPOCH FROM (end_time - start_time));
END;
$$;

-- Function to update vendor overall ratings (optimized)
CREATE OR REPLACE FUNCTION update_vendor_overall_ratings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    WITH vendor_avg_ratings AS (
        SELECT 
            vendor_id,
            AVG(overall_rating) as avg_rating,
            COUNT(*) as rating_count
        FROM vendor_ratings 
        WHERE created_at >= NOW() - INTERVAL '12 months'
          AND overall_rating IS NOT NULL
        GROUP BY vendor_id
        HAVING COUNT(*) >= 3  -- Only update if vendor has at least 3 ratings
    )
    UPDATE vendors 
    SET 
        overall_rating = ROUND(var.avg_rating::NUMERIC, 2),
        updated_at = NOW()
    FROM vendor_avg_ratings var
    WHERE vendors.id = var.vendor_id
      AND vendors.is_active = true
      AND (vendors.overall_rating IS NULL OR 
           ABS(vendors.overall_rating - var.avg_rating) > 0.1);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$;

-- ================================================================
-- PRODUCTION CONFIGURATION FUNCTIONS
-- ================================================================

-- Function to analyze database performance
CREATE OR REPLACE FUNCTION analyze_production_performance()
RETURNS TABLE (
    metric_name VARCHAR(100),
    metric_value TEXT,
    status VARCHAR(20),
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check slow queries
    RETURN QUERY
    SELECT 
        'Slow Queries (>1s)'::VARCHAR(100),
        COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 10 THEN 'WARNING' ELSE 'OK' END::VARCHAR(20),
        CASE WHEN COUNT(*) > 10 
             THEN 'Review and optimize slow queries'
             ELSE 'Query performance is acceptable'
        END::TEXT
    FROM pg_stat_statements
    WHERE mean_exec_time > 1000;
    
    -- Check connection count
    RETURN QUERY
    SELECT 
        'Active Connections'::VARCHAR(100),
        COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 80 THEN 'WARNING' 
             WHEN COUNT(*) > 50 THEN 'CAUTION' 
             ELSE 'OK' END::VARCHAR(20),
        CASE WHEN COUNT(*) > 80 
             THEN 'Consider connection pooling'
             ELSE 'Connection count is healthy'
        END::TEXT
    FROM pg_stat_activity
    WHERE state != 'idle';
    
    -- Check largest tables
    RETURN QUERY
    SELECT 
        'Database Size'::VARCHAR(100),
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        CASE WHEN pg_database_size(current_database()) > 10*1024*1024*1024 
             THEN 'WARNING' ELSE 'OK' END::VARCHAR(20),
        'Monitor growth and plan archiving if needed'::TEXT;
        
    -- Check index usage
    RETURN QUERY
    SELECT 
        'Unused Indexes'::VARCHAR(100),
        COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 5 THEN 'WARNING' ELSE 'OK' END::VARCHAR(20),
        'Review and drop unused indexes to improve write performance'::TEXT
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0 
      AND schemaname = 'public';
END;
$$;

-- ================================================================
-- OPTIMIZED TRIGGERS FOR DATA CONSISTENCY
-- ================================================================

-- Enhanced update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if there are actual changes
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply optimized timestamp triggers (drop and recreate for safety)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at 
    BEFORE UPDATE ON vendors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boms_updated_at ON boms;
CREATE TRIGGER update_boms_updated_at 
    BEFORE UPDATE ON boms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bom_items_updated_at ON bom_items;
CREATE TRIGGER update_bom_items_updated_at 
    BEFORE UPDATE ON bom_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SECURITY IMPROVEMENTS
-- ================================================================

-- Improved RLS policies (replace existing if any)
DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'projects' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- Simple, performant RLS policy for projects
DROP POLICY IF EXISTS "users_own_projects_v2" ON projects;
CREATE POLICY "users_own_projects_v2" ON projects
    FOR ALL USING (
        user_id::text = current_setting('app.current_user_id', true)
        OR current_setting('app.user_role', true) = 'admin'
    );

-- ================================================================
-- PRODUCTION MONITORING SETUP
-- ================================================================

-- Create monitoring schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Production monitoring views
CREATE OR REPLACE VIEW monitoring.slow_queries_production AS
SELECT 
    left(query, 100) as query_preview,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Active connections with useful details
CREATE OR REPLACE VIEW monitoring.active_connections_production AS
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start as query_duration,
    left(query, 200) as query_preview
FROM pg_stat_activity
WHERE state != 'idle' AND query != '<IDLE>'
ORDER BY query_start;

-- Table sizes for capacity planning
CREATE OR REPLACE VIEW monitoring.table_sizes_production AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ================================================================
-- FINALIZE MIGRATION
-- ================================================================

-- Update statistics for better query planning
ANALYZE;

-- Record this migration
INSERT INTO schema_migrations (version, description, checksum) 
VALUES ('001_production_optimization', 'Production performance optimization and monitoring setup', 'sha256:prod_opt_v1.0.0')
ON CONFLICT (version) DO UPDATE SET
    applied_at = NOW(),
    description = EXCLUDED.description,
    checksum = EXCLUDED.checksum;

-- ================================================================
-- MIGRATION COMPLETION MESSAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE 'Production optimization migration completed successfully';
    RAISE NOTICE 'Added % performance indexes', 
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%_perf');
    RAISE NOTICE 'Created % materialized views for reporting', 2;
    RAISE NOTICE 'Added % monitoring views', 
        (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'monitoring');
    RAISE NOTICE 'Next steps: Run SELECT * FROM analyze_production_performance();';
END$$;