-- ============================================================================
-- Migration: Setup Supabase Storage Bucket for BOM Files
-- Description: Creates storage bucket and RLS policies for 2D/3D file uploads
-- Industry Standard: Follows 2025-2026 Supabase Storage best practices
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bom-files',
  'bom-files',
  false,  -- Private bucket - files only accessible via signed URLs
  104857600,  -- 100MB max file size
  ARRAY[
    -- 3D CAD file types
    'application/step',
    'application/sla',
    'model/stl',
    'application/octet-stream',
    'application/stp',
    'model/obj',
    'application/iges',
    -- 2D drawing file types
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    -- CAD-specific
    'application/acad',
    'application/dxf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE OBJECT POLICIES (RLS for Files)
-- ============================================================================

-- Enable RLS on storage.objects (should already be enabled by default)
-- This is a safety measure
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy 1: Allow authenticated users to upload files to their own folders
-- Pattern: {user_id}/{project_id}/bom-items/{bom_item_id}/{file_type}/{file}
-- ============================================================================
CREATE POLICY "Users can upload files to their own folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bom-files' AND
  -- The file path must start with the user's UUID
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Policy 2: Allow authenticated users to read files from their own folders
-- ============================================================================
CREATE POLICY "Users can read files from their own folders"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Policy 3: Allow authenticated users to update files in their own folders
-- ============================================================================
CREATE POLICY "Users can update files in their own folders"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Policy 4: Allow authenticated users to delete files from their own folders
-- ============================================================================
CREATE POLICY "Users can delete files from their own folders"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Policy 5: Allow service role full access (for backend operations)
-- ============================================================================
CREATE POLICY "Service role has full access to bom-files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'bom-files')
WITH CHECK (bucket_id = 'bom-files');

-- ============================================================================
-- 3. COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON POLICY "Users can upload files to their own folders" ON storage.objects IS
'Industry standard: Users can only upload files to folders starting with their UUID';

COMMENT ON POLICY "Users can read files from their own folders" ON storage.objects IS
'Industry standard: Users can only read files from their own folders';

COMMENT ON POLICY "Service role has full access to bom-files" ON storage.objects IS
'Backend service operations bypass RLS using service role key';

-- ============================================================================
-- 4. VERIFY BUCKET SETUP
-- ============================================================================
-- Run this to verify the bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'bom-files';
--
-- Run this to verify policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%bom%';
