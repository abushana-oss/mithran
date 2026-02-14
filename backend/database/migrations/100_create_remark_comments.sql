-- Create remark comments table for GitHub-style commenting system
CREATE TABLE remark_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remark_id UUID NOT NULL REFERENCES remarks_and_issues(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_comment_text_not_empty CHECK (char_length(trim(comment_text)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_remark_comments_remark_id ON remark_comments(remark_id);
CREATE INDEX idx_remark_comments_created_by ON remark_comments(created_by);
CREATE INDEX idx_remark_comments_created_at ON remark_comments(created_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_remark_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_remark_comments_updated_at
    BEFORE UPDATE ON remark_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_remark_comments_updated_at();

-- Add comment to track purpose
COMMENT ON TABLE remark_comments IS 'Comments for remarks and issues - GitHub-style discussion threads';
COMMENT ON COLUMN remark_comments.comment_text IS 'The comment content - supports markdown';
COMMENT ON COLUMN remark_comments.created_by IS 'User who created the comment';