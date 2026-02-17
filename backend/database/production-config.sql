-- ================================================================
-- ADAPTIVE PRODUCTION MIGRATION (FINAL SAFE VERSION)
-- Version: 2.4.0
-- ================================================================


-------------------------------------------------
-- SAFETY: BLOCK REPLICA
-------------------------------------------------
DO $$
BEGIN
    IF pg_is_in_recovery() THEN
        RAISE EXCEPTION 'Cannot run migration on read replica';
    END IF;
END$$;


-------------------------------------------------
-- SAFETY: PREVENT DOUBLE RUN
-------------------------------------------------
SELECT pg_advisory_lock(556677889);


-------------------------------------------------
-- ATOMIC TRANSACTION
-------------------------------------------------
BEGIN;


-------------------------------------------------
-- MIGRATION TRACKING
-------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
    version        VARCHAR(255) PRIMARY KEY,
    applied_at     TIMESTAMPTZ DEFAULT NOW(),
    checksum       TEXT,
    description    TEXT,
    rollback_sql   TEXT
);


-------------------------------------------------
-- PROJECTS TABLE
-------------------------------------------------

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

UPDATE projects
SET project_name = name
WHERE project_name IS NULL
AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='projects'
    AND column_name='name'
);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS end_date DATE;


-------------------------------------------------
-- BOMS TABLE
-------------------------------------------------

ALTER TABLE boms
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE boms
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE boms
ADD COLUMN IF NOT EXISTS total_cost_inr DECIMAL(20,4) DEFAULT 0;


-------------------------------------------------
-- BOM ITEMS TABLE
-------------------------------------------------

ALTER TABLE bom_items
ADD COLUMN IF NOT EXISTS level_in_bom INTEGER DEFAULT 0;

ALTER TABLE bom_items
ADD COLUMN IF NOT EXISTS make_buy VARCHAR(10) DEFAULT 'make';

ALTER TABLE bom_items
ADD COLUMN IF NOT EXISTS total_cost_inr DECIMAL(20,4) DEFAULT 0;


-------------------------------------------------
-- VENDORS TABLE
-------------------------------------------------

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE vendors
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS overall_rating DECIMAL(3,2);


-------------------------------------------------
-- SAFE CONSTRAINTS
-------------------------------------------------

-- projects_budget_positive
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='projects_budget_positive'
) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_budget_positive
    CHECK (budget IS NULL OR budget > 0)
    NOT VALID;
END IF;
END$$;

-- projects_valid_dates
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='projects_valid_dates'
) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_valid_dates
    CHECK (
        end_date IS NULL
        OR start_date IS NULL
        OR end_date >= start_date
    )
    NOT VALID;
END IF;
END$$;

-- boms_cost_positive
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='boms_cost_positive'
) THEN
    ALTER TABLE boms
    ADD CONSTRAINT boms_cost_positive
    CHECK (total_cost_inr >= 0)
    NOT VALID;
END IF;
END$$;

-- bom_items_level_positive
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='bom_items_level_positive'
) THEN
    ALTER TABLE bom_items
    ADD CONSTRAINT bom_items_level_positive
    CHECK (level_in_bom >= 0)
    NOT VALID;
END IF;
END$$;

-- bom_items_make_buy_check
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='bom_items_make_buy_check'
) THEN
    ALTER TABLE bom_items
    ADD CONSTRAINT bom_items_make_buy_check
    CHECK (make_buy IN ('make','buy'))
    NOT VALID;
END IF;
END$$;

-- bom_items_cost_positive
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='bom_items_cost_positive'
) THEN
    ALTER TABLE bom_items
    ADD CONSTRAINT bom_items_cost_positive
    CHECK (total_cost_inr >= 0)
    NOT VALID;
END IF;
END$$;

-- vendors_rating_range
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='vendors_rating_range'
) THEN
    ALTER TABLE vendors
    ADD CONSTRAINT vendors_rating_range
    CHECK (
        overall_rating IS NULL
        OR overall_rating BETWEEN 0 AND 5
    )
    NOT VALID;
END IF;
END$$;

-- fk_projects_user
DO $$
BEGIN
IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='fk_projects_user'
) THEN
    ALTER TABLE projects
    ADD CONSTRAINT fk_projects_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    NOT VALID;
END IF;
END$$;


-------------------------------------------------
-- INDEXES
-------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_projects_user_status_adaptive
ON projects (user_id, status);

CREATE INDEX IF NOT EXISTS idx_boms_project_active_adaptive
ON boms (project_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_bom_items_bom_type_adaptive
ON bom_items (bom_id, item_type);

CREATE INDEX IF NOT EXISTS idx_vendors_active_adaptive
ON vendors (is_active)
WHERE is_active = true;


-------------------------------------------------
-- MONITORING SCHEMA
-------------------------------------------------

CREATE SCHEMA IF NOT EXISTS monitoring;


-------------------------------------------------
-- MONITORING VIEWS (SAFE RECREATE)
-------------------------------------------------

DROP VIEW IF EXISTS monitoring.current_schema_state CASCADE;
DROP VIEW IF EXISTS monitoring.table_performance CASCADE;
DROP VIEW IF EXISTS monitoring.index_usage CASCADE;


CREATE VIEW monitoring.current_schema_state AS
SELECT
    t.table_name,
    COUNT(c.column_name) AS column_count,
    COUNT(i.indexname) AS index_count,
    pg_size_pretty(pg_total_relation_size('public.'||t.table_name)) AS table_size
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name=c.table_name
 AND c.table_schema='public'
LEFT JOIN pg_indexes i
  ON t.table_name=i.tablename
 AND i.schemaname='public'
WHERE t.table_schema='public'
  AND t.table_type='BASE TABLE'
GROUP BY t.table_name
ORDER BY pg_total_relation_size('public.'||t.table_name) DESC;


CREATE VIEW monitoring.table_performance AS
SELECT
    t.table_name,
    pg_size_pretty(pg_total_relation_size('public.'||t.table_name)) AS table_size,
    pg_total_relation_size('public.'||t.table_name) AS size_bytes,
    COUNT(c.column_name) AS column_count,
    COUNT(i.indexname) AS index_count,
    'Enable pg_stat_statements' AS note
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name=c.table_name
 AND c.table_schema='public'
LEFT JOIN pg_indexes i
  ON t.table_name=i.tablename
 AND i.schemaname='public'
WHERE t.table_schema='public'
  AND t.table_type='BASE TABLE'
GROUP BY t.table_name;


CREATE VIEW monitoring.index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname='public';


-------------------------------------------------
-- VALIDATION FUNCTION
-------------------------------------------------

CREATE OR REPLACE FUNCTION monitoring.validate_schema_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT,
    action_required TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

RETURN QUERY
SELECT
    'Foreign Keys',
    CASE WHEN COUNT(*)>0 THEN 'OK' ELSE 'WARNING' END,
    COUNT(*)||' foreign keys',
    CASE WHEN COUNT(*)>0 THEN 'None' ELSE 'Add FKs' END
FROM information_schema.table_constraints
WHERE constraint_type='FOREIGN KEY'
AND table_schema='public';

RETURN QUERY
SELECT
    'Adaptive Indexes',
    CASE WHEN COUNT(*)>=4 THEN 'OK' ELSE 'WARNING' END,
    COUNT(*)||' adaptive indexes',
    CASE WHEN COUNT(*)>=4 THEN 'Healthy' ELSE 'Add indexes' END
FROM pg_indexes
WHERE indexname LIKE '%_adaptive';

END$$;


-------------------------------------------------
-- VALIDATE CONSTRAINTS
-------------------------------------------------

ALTER TABLE projects VALIDATE CONSTRAINT projects_budget_positive;
ALTER TABLE projects VALIDATE CONSTRAINT projects_valid_dates;

ALTER TABLE boms VALIDATE CONSTRAINT boms_cost_positive;

ALTER TABLE bom_items VALIDATE CONSTRAINT bom_items_level_positive;
ALTER TABLE bom_items VALIDATE CONSTRAINT bom_items_make_buy_check;
ALTER TABLE bom_items VALIDATE CONSTRAINT bom_items_cost_positive;

ALTER TABLE vendors VALIDATE CONSTRAINT vendors_rating_range;

ALTER TABLE projects VALIDATE CONSTRAINT fk_projects_user;


-------------------------------------------------
-- OPTIMIZATION (TX SAFE)
-------------------------------------------------

ANALYZE;


-------------------------------------------------
-- RECORD MIGRATION
-------------------------------------------------

INSERT INTO schema_migrations (
    version,
    description,
    checksum,
    rollback_sql
)
VALUES (
    '002_adaptive_production_migration_v2_4',
    'Final postgres-safe migration',
    'sha256:v2.4.0',
    'MANUAL'
)
ON CONFLICT (version)
DO UPDATE SET
    applied_at=NOW(),
    description=EXCLUDED.description,
    checksum=EXCLUDED.checksum;


-------------------------------------------------
-- FINAL REPORT
-------------------------------------------------

DO $$
DECLARE
    t INT;
    i INT;
    c INT;
BEGIN

SELECT COUNT(*) INTO t
FROM information_schema.tables
WHERE table_schema='public';

SELECT COUNT(*) INTO i
FROM pg_indexes
WHERE schemaname='public';

SELECT COUNT(*) INTO c
FROM information_schema.table_constraints
WHERE table_schema='public';

RAISE NOTICE 'MIGRATION COMPLETE';
RAISE NOTICE 'Tables: %, Indexes: %, Constraints: %', t,i,c;
RAISE NOTICE 'Run: SELECT * FROM monitoring.validate_schema_integrity();';

END$$;


-------------------------------------------------
-- COMMIT + UNLOCK
-------------------------------------------------

COMMIT;

SELECT pg_advisory_unlock(556677889);
