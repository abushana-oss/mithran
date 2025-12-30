-- ============================================================================
-- UPDATE PASSWORD FOR emuski@mithran.com
-- ============================================================================
-- Run this in: https://iuvtsvjpmovfymvnmqys.supabase.co/project/iuvtsvjpmovfymvnmqys/sql
--
-- This will update the password to: AdminMithran67
-- ============================================================================

-- Update the user's password
-- Note: Supabase will automatically hash this password
UPDATE auth.users
SET
  encrypted_password = crypt('AdminMithran67', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'emuski@mithran.com';

-- Verify the user exists
SELECT
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  CASE
    WHEN encrypted_password IS NOT NULL THEN 'Password set ✓'
    ELSE 'No password'
  END as password_status
FROM auth.users
WHERE email = 'emuski@mithran.com';

-- ============================================================================
-- DONE! Password updated to: AdminMithran67
-- ============================================================================
--
-- You can now login with:
-- Email: emuski@mithran.com
-- Password: AdminMithran67
-- ============================================================================
