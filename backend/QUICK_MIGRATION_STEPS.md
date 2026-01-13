# Quick Migration Steps - Run These in Order!

## ⚡ Fast Track (3 steps)

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

### Step 1: Run Migration 011 (Creates base tables)
```
File: backend/migrations/011_process_planning_tables.sql
```
1. Copy all content from the file above
2. Paste into Supabase SQL Editor
3. Click **Run**
4. Wait for ✅ Success

---

### Step 2: Run Migration 026 (Adds workflow & roles)
```
File: backend/migrations/026_process_planning_redesign.sql
```
1. Click **New Query**
2. Copy all content from the file above
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for ✅ Success

---

### Step 3: Run Migration 027 (Seeds user roles)
```
File: backend/migrations/027_seed_user_roles.sql
```
1. Click **New Query**
2. Copy all content from the file above
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for ✅ Success

---

## ✅ Done!

After all 3 migrations succeed, you should have:

**New Tables:**
- `process_routes` ← (from 011)
- `process_route_steps` ← (from 011)
- `process_templates` ← (from 011)
- `process_template_steps` ← (from 011)
- `user_roles` ← (from 026)
- `process_route_workflow_history` ← (from 026)
- `process_planning_sessions` ← (from 026)

**Enhanced Columns:**
- `process_routes` now has workflow_state, priority, process_group, etc.
- `process_route_steps` now has calculator_mapping_id, extracted_values, is_completed

---

## 🚨 Troubleshooting

**Error: "relation already exists"**
- This is OK! The migration uses `IF NOT EXISTS`
- It means that part already ran
- The migration will continue with other parts

**Error: "relation does not exist"**
- Make sure you run them IN ORDER: 011 → 026 → 027
- Migration 011 MUST run first!

**Error: "permission denied"**
- Make sure you're logged into Supabase dashboard
- Use the SQL Editor in the dashboard (not API calls)

---

## 🎯 Next Steps

Once migrations complete successfully:
1. Backend API endpoints will work
2. Frontend can connect to new features
3. Process planning page will function

The implementation is ready to go once these migrations run!
