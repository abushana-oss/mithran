-- ============================================================================
-- MIGRATION 027: Seed User Roles
-- ============================================================================
-- This migration assigns default roles to existing users
-- All users with processes get the 'process_planner' role by default
-- ============================================================================

-- ============================================================================
-- Seed default 'process_planner' role for existing users with processes
-- ============================================================================
INSERT INTO user_roles (user_id, role, is_primary, organization_id)
SELECT DISTINCT
  user_id,
  'process_planner' as role,
  true as is_primary,
  organization_id
FROM processes
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- Seed default 'process_planner' role for users with BOMs
-- (These users likely need process planning capabilities)
-- ============================================================================
INSERT INTO user_roles (user_id, role, is_primary, organization_id)
SELECT DISTINCT
  user_id,
  'process_planner' as role,
  true as is_primary,
  organization_id
FROM boms
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO UPDATE
SET is_primary = EXCLUDED.is_primary
WHERE user_roles.is_primary = false;

-- ============================================================================
-- Seed default 'process_planner' role for users with existing process_routes
-- ============================================================================
INSERT INTO user_roles (user_id, role, is_primary, organization_id)
SELECT DISTINCT
  user_id,
  'process_planner' as role,
  true as is_primary,
  organization_id
FROM process_routes
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- Log seeding results
-- ============================================================================
DO $$
DECLARE
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM user_roles;
  RAISE NOTICE 'Total user roles after seeding: %', role_count;
END $$;

-- ============================================================================
-- End of Migration 027
-- ============================================================================
