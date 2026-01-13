-- Migration 028: User Roles Table
-- Purpose: Enable role-based access control for process planning
-- Roles: process_planner, production_manager, shop_floor, design_engineer

CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('process_planner', 'production_manager', 'shop_floor', 'design_engineer', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Add index for faster role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Add comments for documentation
COMMENT ON TABLE user_roles IS 'Role-based access control for process planning workflows';
COMMENT ON COLUMN user_roles.role IS 'User role: process_planner (full CRUD), production_manager (approve/reject), shop_floor (execute), design_engineer (view/link BOM)';
