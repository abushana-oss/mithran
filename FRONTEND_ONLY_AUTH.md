# Frontend-Only Authorization with Supabase RLS

Your application now uses **true frontend-only architecture** with all authorization enforced by Supabase Row Level Security (RLS) policies.

## Architecture

```
Frontend (Next.js)
   ↓
Supabase Auth (JWT)
   ↓
Supabase Postgres + RLS (authorization enforcement)
```

**No backend authorization checks**
**No /auth/me endpoint needed**
**Database enforces everything**

## How It Works

### 1. Authentication (Who you are)
- Users sign in with Supabase (email/password or Google OAuth)
- Supabase issues JWT token
- Frontend stores session

### 2. Authorization (What you can access)
- User makes database queries through Supabase client
- Supabase runs RLS policies on EVERY query
- RLS policy checks:
  1. Is user authenticated? (`auth.uid()`)
  2. Is user's email in `authorized_users` table?
  3. Is user active? (`is_active = true`)
- If ANY check fails → Query returns 0 rows / fails
- If all pass → Normal data access rules apply

### 3. Data Access Rules
After passing authorization check:
- Users can only see/edit their own data (`user_id = auth.uid()`)
- Each table has separate policies for SELECT, INSERT, UPDATE, DELETE
- Child tables (e.g., `bom_items`) inherit parent permissions

## Setup Instructions

### Step 1: Run Database Migrations

Go to Supabase SQL Editor:
https://iuvtsvjpmovfymvnmqys.supabase.co/project/iuvtsvjpmovfymvnmqys/sql

**Run these migrations in order:**

1. **Create authorized_users table:**
   ```sql
   -- Copy and run: backend/migrations/018_authorized_users.sql
   ```

2. **Set up RLS authorization:**
   ```sql
   -- Copy and run: backend/migrations/019_rls_authorization.sql
   ```

### Step 2: Add Authorized Users

After running migrations, add authorized users:

```sql
-- Add yourself as admin
INSERT INTO authorized_users (email, full_name, role, is_active)
VALUES ('emuski@EMITHRAN.com', 'Emuski', 'admin', true);

-- Add more users
INSERT INTO authorized_users (email, full_name, role, is_active)
VALUES
  ('user1@company.com', 'User One', 'user', true),
  ('user2@company.com', 'User Two', 'user', true);
```

### Step 3: Test Authorization

**Test 1: Authorized user**
1. Add your email to `authorized_users` table
2. Sign in to the application
3. ✅ Should see dashboard and your data

**Test 2: Unauthorized user**
1. Try signing in with email NOT in `authorized_users`
2. ✅ Can sign in successfully (Supabase allows)
3. ✅ Dashboard loads but shows NO data
4. ✅ All queries return empty results
5. ✅ Cannot create/edit/delete anything

This is **correct behavior** - unauthorized users can authenticate but cannot access any data.

## Managing Users

### View all authorized users
```sql
SELECT email, full_name, role, is_active, created_at
FROM authorized_users
ORDER BY created_at DESC;
```

### Add new user
```sql
INSERT INTO authorized_users (email, full_name, role, is_active)
VALUES ('newuser@company.com', 'New User', 'user', true);
```

### Deactivate user (soft delete)
```sql
UPDATE authorized_users
SET is_active = false
WHERE email = 'user@example.com';
```

### Reactivate user
```sql
UPDATE authorized_users
SET is_active = true
WHERE email = 'user@example.com';
```

### Permanently remove user
```sql
DELETE FROM authorized_users
WHERE email = 'user@example.com';
```

## How RLS Policies Work

### The Authorization Function

Every RLS policy uses this function:

```sql
CREATE FUNCTION is_user_authorized()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  is_active_user BOOLEAN;
BEGIN
  -- Get current user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if email exists in authorized_users and is active
  SELECT is_active INTO is_active_user
  FROM authorized_users
  WHERE email = user_email;

  -- Return true only if found and active
  RETURN COALESCE(is_active_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Example Policy (Projects Table)

```sql
CREATE POLICY "Authorized users can view their own projects"
    ON projects FOR SELECT
    USING (
      auth.uid() = user_id           -- User owns this project
      AND is_user_authorized()       -- User is in authorized_users
    );
```

**What happens:**
1. User queries: `SELECT * FROM projects`
2. Postgres runs the policy for EACH row
3. Policy checks: Does user own this row? Is user authorized?
4. Only matching rows are returned
5. Unauthorized users get 0 rows

## Tables Protected by RLS

All tables enforce authorization:

**Core Tables:**
- `projects` - User's projects
- `boms` - Bill of materials
- `bom_items` - BOM line items

**Vendor Tables:**
- `vendors` - Vendor/supplier database
- `vendor_equipment` - Equipment listings
- `vendor_services` - Service capabilities
- `vendor_contacts` - Contact information

**Materials Tables:**
- `materials` - Material library

**Meta Table:**
- `authorized_users` - Can view only if authorized

## Benefits of This Approach

✅ **Security:** Authorization enforced at database level, impossible to bypass
✅ **Simple:** No backend authorization code to maintain
✅ **Fast:** No extra API calls to verify access
✅ **Scalable:** Postgres handles all checks efficiently
✅ **Frontend-Only:** True JAMstack architecture

## What Happens to Unauthorized Users?

1. **Can sign in** - Supabase Auth allows authentication
2. **Can see UI** - React components load
3. **Cannot see data** - All queries return empty results
4. **Cannot create data** - INSERT fails silently
5. **Cannot edit data** - UPDATE fails silently
6. **Cannot delete data** - DELETE fails silently

From the user's perspective: The app loads but appears empty.

## Disabling Public Signups (Optional)

If you want to prevent unauthorized users from even creating accounts:

1. Go to Supabase Auth Settings:
   https://iuvtsvjpmovfymvnmqys.supabase.co/project/iuvtsvjpmovfymvnmqys/auth/settings

2. Disable "Enable email signups"

3. Now only manually created users can sign in

## Backend Role

The NestJS backend still exists but:
- ❌ Does NOT check authorization
- ✅ Only verifies JWT token is valid
- ✅ Passes token to Supabase client
- ✅ Supabase enforces RLS on all queries

You could remove the backend entirely and use Supabase directly from the frontend, but keeping it allows for:
- Complex business logic
- File uploads
- Third-party API integrations
- Server-side processing

## Troubleshooting

### User can sign in but sees no data
✅ **Expected behavior** - User is not in `authorized_users` table
→ Add them: `INSERT INTO authorized_users (email, ...) VALUES (...)`

### User sees "No projects" but they have data
❌ Check if user is active: `SELECT is_active FROM authorized_users WHERE email = 'user@email.com'`
→ Reactivate: `UPDATE authorized_users SET is_active = true WHERE email = 'user@email.com'`

### RLS policies not working
1. Check if RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
2. Run migration 019 again to ensure policies are created
3. Check function exists: `SELECT * FROM pg_proc WHERE proname = 'is_user_authorized';`

### How to test RLS policies
```sql
-- Test as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM projects;
-- Should only return that user's projects (if authorized)
```

## Summary

**Before:** Backend checked `authorized_users` → Frontend called `/auth/me`
**Now:** Database checks `authorized_users` via RLS → No backend check needed

**This is the Supabase-native way to handle authorization.**
