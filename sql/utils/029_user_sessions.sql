-- Migration 029: User Sessions Table
-- Purpose: Persist user session state (active tab, filters) for better UX
-- Enables users to return to their last context when they reopen the process planning page

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_tab VARCHAR(50) DEFAULT 'machining' CHECK (active_tab IN ('machining', 'sheet_metal', 'assembly', 'plastic_rubber', 'post_processing', 'packing_delivery')),
  filters JSONB DEFAULT '{}', -- Store filter state: {status: ['draft', 'approved'], search: '', bomItemId: 123}
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Add index for faster session lookups
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_accessed ON user_sessions(last_accessed);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at on row modification
CREATE TRIGGER user_sessions_updated_at_trigger
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_user_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_sessions IS 'Stores user session context for process planning page to persist state across visits';
COMMENT ON COLUMN user_sessions.active_tab IS 'Last active process category tab';
COMMENT ON COLUMN user_sessions.filters IS 'JSON object containing active filters: status, search, bomItemId, dateRange, etc.';
COMMENT ON COLUMN user_sessions.last_accessed IS 'Timestamp of last page access for session cleanup';
