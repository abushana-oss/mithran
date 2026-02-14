-- =============================================
-- Create Remarks and Issues System
-- =============================================

-- Create remarks_and_issues table
CREATE TABLE IF NOT EXISTS remarks_and_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES production_lots(id) ON DELETE CASCADE,
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    remark_type VARCHAR(50) NOT NULL CHECK (remark_type IN ('DELAY', 'QUALITY', 'SUGGESTION', 'SAFETY', 'PROCESS', 'MATERIAL', 'OTHER')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    
    -- Context/Scope Information
    applies_to VARCHAR(20) NOT NULL CHECK (applies_to IN ('LOT', 'PROCESS', 'SUBTASK')),
    process_id UUID REFERENCES production_processes(id) ON DELETE SET NULL,
    subtask_id UUID REFERENCES process_subtasks(id) ON DELETE SET NULL,
    context_reference VARCHAR(255), -- Additional context like "Material Preparation", "Assembly", etc.
    
    -- Assignment and Tracking
    created_by UUID NOT NULL,
    assigned_to UUID,
    reported_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    resolved_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Impact Assessment
    impact_level VARCHAR(20) CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    estimated_delay_hours INTEGER DEFAULT 0,
    actual_delay_hours INTEGER DEFAULT 0,
    
    -- Additional Metadata
    tags TEXT[], -- Array of tags for categorization
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment references
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create remarks_comments table for threaded discussions
CREATE TABLE IF NOT EXISTS remarks_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remark_id UUID NOT NULL REFERENCES remarks_and_issues(id) ON DELETE CASCADE,
    
    -- Comment Content
    comment_text TEXT NOT NULL,
    
    -- Author Information
    author_id UUID NOT NULL,
    author_name VARCHAR(255), -- Denormalized for display
    
    -- Comment Threading
    parent_comment_id UUID REFERENCES remarks_comments(id) ON DELETE CASCADE,
    thread_level INTEGER DEFAULT 0, -- For display indentation
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_remarks_lot_id ON remarks_and_issues(lot_id);
CREATE INDEX IF NOT EXISTS idx_remarks_type ON remarks_and_issues(remark_type);
CREATE INDEX IF NOT EXISTS idx_remarks_priority ON remarks_and_issues(priority);
CREATE INDEX IF NOT EXISTS idx_remarks_status ON remarks_and_issues(status);
CREATE INDEX IF NOT EXISTS idx_remarks_assigned_to ON remarks_and_issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_remarks_created_by ON remarks_and_issues(created_by);
CREATE INDEX IF NOT EXISTS idx_remarks_reported_date ON remarks_and_issues(reported_date);
CREATE INDEX IF NOT EXISTS idx_remarks_process_id ON remarks_and_issues(process_id);
CREATE INDEX IF NOT EXISTS idx_remarks_subtask_id ON remarks_and_issues(subtask_id);

CREATE INDEX IF NOT EXISTS idx_comments_remark_id ON remarks_comments(remark_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON remarks_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON remarks_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON remarks_comments(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_remarks_updated_at ON remarks_and_issues;
DROP TRIGGER IF EXISTS update_comments_updated_at ON remarks_comments;

CREATE TRIGGER update_remarks_updated_at BEFORE UPDATE ON remarks_and_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON remarks_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE remarks_and_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all remarks" ON remarks_and_issues;
DROP POLICY IF EXISTS "Users can create remarks" ON remarks_and_issues;
DROP POLICY IF EXISTS "Users can update remarks" ON remarks_and_issues;
DROP POLICY IF EXISTS "Users can delete remarks" ON remarks_and_issues;

DROP POLICY IF EXISTS "Users can view all comments" ON remarks_comments;
DROP POLICY IF EXISTS "Users can create comments" ON remarks_comments;
DROP POLICY IF EXISTS "Users can update comments" ON remarks_comments;
DROP POLICY IF EXISTS "Users can delete comments" ON remarks_comments;

-- Create RLS policies for remarks_and_issues (simplified for development)
CREATE POLICY "Users can view all remarks"
    ON remarks_and_issues FOR SELECT
    USING (true);

CREATE POLICY "Users can create remarks"
    ON remarks_and_issues FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update remarks"
    ON remarks_and_issues FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete remarks"
    ON remarks_and_issues FOR DELETE
    USING (true);

-- Create RLS policies for remarks_comments (simplified for development)
CREATE POLICY "Users can view all comments"
    ON remarks_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can create comments"
    ON remarks_comments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update comments"
    ON remarks_comments FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete comments"
    ON remarks_comments FOR DELETE
    USING (true);

-- Create function to automatically update remark status based on resolution
CREATE OR REPLACE FUNCTION update_remark_status_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
    -- If resolution_notes is added and resolved_date is set, mark as resolved
    IF NEW.resolution_notes IS NOT NULL AND NEW.resolution_notes != '' 
       AND NEW.resolved_date IS NOT NULL AND OLD.resolved_date IS NULL THEN
        NEW.status = 'RESOLVED';
    END IF;
    
    -- If resolution is cleared, reopen the remark
    IF NEW.resolution_notes IS NULL AND OLD.resolution_notes IS NOT NULL THEN
        NEW.status = 'OPEN';
        NEW.resolved_date = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_remark_status ON remarks_and_issues;

CREATE TRIGGER trigger_update_remark_status
    BEFORE UPDATE ON remarks_and_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_remark_status_on_resolution();


-- Add helpful comments for documentation
COMMENT ON TABLE remarks_and_issues IS 'Tracks issues, suggestions, delays, and other remarks for production lots';
COMMENT ON TABLE remarks_comments IS 'Threaded comments and discussions for remarks and issues';

COMMENT ON COLUMN remarks_and_issues.remark_type IS 'Type of remark: DELAY, QUALITY, SUGGESTION, SAFETY, PROCESS, MATERIAL, OTHER';
COMMENT ON COLUMN remarks_and_issues.priority IS 'Priority level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN remarks_and_issues.status IS 'Current status: OPEN, IN_PROGRESS, RESOLVED, CLOSED';
COMMENT ON COLUMN remarks_and_issues.applies_to IS 'Scope: LOT (entire lot), PROCESS (specific process), SUBTASK (specific subtask)';
COMMENT ON COLUMN remarks_and_issues.impact_level IS 'Expected impact level on production';
COMMENT ON COLUMN remarks_and_issues.tags IS 'Array of tags for flexible categorization and filtering';