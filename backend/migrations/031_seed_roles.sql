-- Migration 031: Seed User Roles
-- Purpose: Add default roles for existing users and setup admin users
-- Note: This migration is idempotent and can be run multiple times safely

-- Function to assign role to user if not already assigned
CREATE OR REPLACE FUNCTION assign_user_role(p_user_id INTEGER, p_role VARCHAR(50))
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Assign admin role to user ID 1 (typically the first user/system admin)
-- Note: Adjust this based on your actual user setup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = 1) THEN
    PERFORM assign_user_role(1, 'admin');
    PERFORM assign_user_role(1, 'process_planner');
    PERFORM assign_user_role(1, 'production_manager');
    RAISE NOTICE 'Assigned admin, process_planner, and production_manager roles to user ID 1';
  END IF;
END $$;

-- Example: Assign default process_planner role to all existing users without roles
-- Uncomment and modify as needed for your use case
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'process_planner'
-- FROM users
-- WHERE id NOT IN (SELECT DISTINCT user_id FROM user_roles)
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Add comments
COMMENT ON FUNCTION assign_user_role IS 'Helper function to safely assign roles to users, preventing duplicates';
