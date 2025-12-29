-- ============================================================================
-- Check Users and Materials
-- ============================================================================
-- Run this in Supabase SQL Editor to see what users and materials exist
-- ============================================================================

-- Check all users
SELECT
    id as user_id,
    email,
    created_at,
    (SELECT COUNT(*) FROM materials WHERE user_id = auth.users.id) as material_count
FROM auth.users
ORDER BY created_at DESC;

-- Check all materials (will bypass RLS since we're using service role in SQL editor)
SELECT
    id,
    material_group,
    material,
    material_grade,
    location,
    user_id,
    created_at
FROM materials
ORDER BY created_at DESC
LIMIT 20;
