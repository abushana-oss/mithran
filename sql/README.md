# SQL Files Organization

This folder contains all SQL files organized by purpose.

## Folder Structure

### migrations/
Production database migrations that should be run in order.
- **000_consolidated_production_schema.sql** - Main production schema (USE THIS)

### queries/
Ad-hoc queries for debugging, data exploration, and analysis.
- These are NOT migrations
- Safe to run in read-only mode
- Used for troubleshooting and data inspection

### utils/
Utility SQL scripts for database maintenance and configuration.
- Configuration scripts
- Schema auditing
- Database utilities

### archive/
Old migrations and deprecated SQL files.
- **DO NOT USE** - Kept for reference only
- Superseded by consolidated schema
- May contain outdated or conflicting migrations

## Best Practices

1. **For Production Deployment:**
   - Use only migrations/000_consolidated_production_schema.sql
   - Do NOT run archived migrations

2. **For Development:**
   - Use queries from queries/ folder for debugging
   - Refer to utils/ for configuration

3. **For Maintenance:**
   - Archive old files instead of deleting
   - Document any new migrations
   - Keep migrations idempotent (safe to run multiple times)

## Migration Strategy

The project has moved to a **consolidated schema approach**:
- Single source of truth: 000_consolidated_production_schema.sql
- All previous migrations are archived
- Cleaner, more maintainable database setup

---
Last updated: 2026-02-16
