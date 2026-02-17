
-- SECURE User Sync
-- This migration REMOVES the auto-add trigger to prevent unauthorized access.
-- It KEEPS the auto-delete trigger to ensure removed users are blocked immediately.

-- 1. Drop the "Auto-Add" trigger (Security Fix)
-- This stops strangers from getting automatic access when they sign in with Google
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_insert();

-- 2. Ensure "Auto-Delete" trigger remains (Requirement)
-- This ensures that when you delete a user in Supabase, they are removed from the whitelist
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_delete();

-- Note: To authorize a user now, you must:
-- 1. Create/Invite them in Supabase Auth
-- 2. Add them to the 'authorized_users' table (Manually or via Script)
