# Database Migration Guide - Process Planning Redesign

## Quick Setup Instructions

### Option 1: Supabase SQL Editor (Recommended - 3 minutes)

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

3. **Run Migration 011 FIRST** (Creates base tables)
   - Copy the entire contents of `backend/migrations/011_process_planning_tables.sql`
   - Paste into the SQL editor
   - Click **Run** (or press Ctrl/Cmd + Enter)
   - Wait for "Success" message
   - **This creates the process_routes and process_route_steps tables**

4. **Run Migration 026** (Adds workflow and roles)
   - Click **New Query** again
   - Copy the entire contents of `backend/migrations/026_process_planning_redesign.sql`
   - Paste into the SQL editor
   - Click **Run**
   - Wait for "Success" message

5. **Run Migration 027** (Seeds user roles)
   - Click **New Query** again
   - Copy the entire contents of `backend/migrations/027_seed_user_roles.sql`
   - Paste into the SQL editor
   - Click **Run**
   - Wait for "Success" message

6. **Verify**
   - Go to **Table Editor** in left sidebar
   - You should see new tables:
     - `user_roles`
     - `process_route_workflow_history`
     - `process_planning_sessions`
   - Check `process_routes` table has new columns:
     - `workflow_state`
     - `process_group`
     - `priority`
     - etc.

---

## What These Migrations Do

### Migration 011 (`011_process_planning_tables.sql`) - PREREQUISITE
Creates the base tables for process planning:

**Tables Created:**
- `process_routes` - Manufacturing sequences for BOM items
- `process_route_steps` - Individual operations within a route
- `process_templates` - Reusable process sequence templates
- `process_template_steps` - Steps within templates

**Features:**
- RLS policies for secure multi-tenant access
- Triggers for auto-updating timestamps
- Indexes for performance
- Foreign key relationships to BOM items and processes

**⚠️ IMPORTANT**: This migration MUST be run before 026 and 027!

### Migration 026 (`026_process_planning_redesign.sql`)
Creates the infrastructure for the redesigned process planning system:

**New Columns Added to `process_routes`:**
- `workflow_state` - Tracks workflow (draft, in_review, approved, active, archived)
- `workflow_updated_at`, `workflow_updated_by` - Audit tracking
- `approved_by`, `approved_at` - Approval tracking
- `created_by_role` - Role of creator (process_planner, production_manager, etc.)
- `assigned_to` - User assignment
- `priority` - Priority level (low, normal, high, urgent)
- `process_group` - For tab filtering (Machining, Sheet Metal, etc.)
- `process_category` - Specific category within group

**New Tables:**
- `process_route_workflow_history` - Audit trail of all workflow changes
- `user_roles` - Role assignments (supports multiple roles per user)
- `process_planning_sessions` - Preserves user UI state and context

**New Columns Added to `process_route_steps`:**
- `calculator_mapping_id` - Links step to calculator
- `extracted_values` - Stores calculation results (JSONB)
- `is_completed` - Tracks step completion

**Triggers:**
- Auto-updates workflow timestamps on state changes
- Auto-logs workflow history
- Ensures only one primary role per user
- Updates session last_accessed timestamp

**Views:**
- `process_routes_detailed` - Routes with joined user and BOM data
- `workflow_history_detailed` - History with user details

### Migration 027 (`027_seed_user_roles.sql`)
Seeds default roles for existing users:
- Assigns `process_planner` role to all users who have processes
- Sets it as their primary role
- Ensures backwards compatibility

---

## Troubleshooting

### Error: "relation already exists"
This means the table/column already exists. This is OK - the migration uses `IF NOT EXISTS` and `IF NOT EXISTS` is safe to run multiple times.

### Error: "permission denied"
Make sure you're using the **Service Role** key in Supabase settings, not the anonymous key.

### Error: "column already exists"
Some columns might already exist from previous migrations. You can either:
1. Skip that specific ALTER statement, or
2. Drop the column first (not recommended unless you know what you're doing)

---

## After Migration

Once migrations are successful, you can:

1. **Test the backend** - Start your NestJS server
2. **Check the API** - New endpoints will be available:
   - `/v1/process-routes` - CRUD operations
   - `/v1/process-routes/:id/workflow/*` - Workflow transitions
   - `/v1/users/me/roles` - Role management
3. **Use the new frontend** - Process planning page will use these new features

---

## Rollback (If Needed)

If you need to rollback, run these commands in Supabase SQL Editor:

```sql
-- Drop new tables
DROP TABLE IF EXISTS process_planning_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS process_route_workflow_history CASCADE;

-- Drop new columns from process_routes
ALTER TABLE process_routes
DROP COLUMN IF EXISTS workflow_state,
DROP COLUMN IF EXISTS workflow_updated_at,
DROP COLUMN IF EXISTS workflow_updated_by,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS created_by_role,
DROP COLUMN IF EXISTS assigned_to,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS process_group,
DROP COLUMN IF EXISTS process_category;

-- Drop new columns from process_route_steps
ALTER TABLE process_route_steps
DROP COLUMN IF EXISTS calculator_mapping_id,
DROP COLUMN IF EXISTS extracted_values,
DROP COLUMN IF EXISTS is_completed;

-- Drop views
DROP VIEW IF EXISTS process_routes_detailed;
DROP VIEW IF EXISTS workflow_history_detailed;

-- Drop functions
DROP FUNCTION IF EXISTS update_workflow_timestamp();
DROP FUNCTION IF EXISTS ensure_single_primary_role();
DROP FUNCTION IF EXISTS update_session_last_accessed();
```

**Warning**: This will delete all workflow data, role assignments, and session data!

---

## Need Help?

If you encounter issues:
1. Check Supabase logs in the Dashboard (Logs section)
2. Verify your database schema matches expected state
3. Ensure all previous migrations (001-025) have run successfully
