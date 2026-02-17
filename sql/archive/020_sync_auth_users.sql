
-- Sync Auth Users to Authorized Users
-- This migration adds triggers to automatically sync Supabase Auth users with the authorized_users whitelist

-- ============================================================================
-- TRIGGER FUNCTION: Sync Delete
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is deleted from auth.users, remove them from authorized_users
  DELETE FROM public.authorized_users
  WHERE email = OLD.email;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER FUNCTION: Sync Insert
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is added to auth.users (e.g. invited or manually created),
  -- automatically add them to authorized_users so they can access the app.
  INSERT INTO public.authorized_users (email, full_name, is_active, role)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    true,
    'user'
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist (to allow idempotency)
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for Deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_delete();

-- Trigger for Creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_insert();
