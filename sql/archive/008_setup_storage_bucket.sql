-- ============================================================================
-- Migration: Setup Supabase Storage Bucket for BOM Files
-- Description: Creates storage bucket and RLS policies for 2D/3D file uploads
-- Industry Standard: Follows 2025-2026 Supabase Storage best practices
--
-- MIME Type Standards:
-- - STEP: model/step (IETF RFC) or application/STEP (ISO 10303-21)
-- - STL: model/stl (IANA registered)
-- - IGES: model/iges (IANA registered)
-- - DWG: image/vnd.dwg (Vendor-specific IANA)
-- - DXF: image/vnd.dxf (Vendor-specific IANA)
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
    -- 3D CAD file types (using standard MIME types)
    'model/step',                    -- STEP files (.step, .stp) - ISO 10303 standard
    'application/STEP',              -- Alternative STEP MIME type
    'model/stl',                     -- STL/SLA files (.stl) - 3D printing standard
    'model/obj',                     -- OBJ files (.obj) - Wavefront 3D model
    'model/iges',                    -- IGES files (.iges, .igs) - CAD exchange format
    'application/x-iges',            -- Alternative IGES MIME type

    -- 2D drawing file types
    'application/pdf',               -- PDF documents
    'image/png',                     -- PNG images
    'image/jpeg',                    -- JPEG images
    'image/jpg',                     -- JPEG alternative extension

    -- AutoCAD file types
    'image/vnd.dwg',                 -- DWG files - AutoCAD drawing
    'application/x-autocad',         -- Alternative AutoCAD MIME type
    'image/vnd.dxf',                 -- DXF files - Drawing Exchange Format
    'application/dxf'                -- Alternative DXF MIME type

    -- ⚠️ WARNING: 'application/octet-stream' removed for security
    -- It allows ANY binary file type, bypassing file type restrictions
    -- If needed for specific use cases, add file extension validation in backend
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE OBJECT POLICIES (RLS for Files)
-- ============================================================================
-- Security Model:
-- - Path pattern: {user_id}/{project_id}/bom-items/{bom_item_id}/{file_type}/{file}
-- - Validates BOTH user_id match AND project ownership via JOIN to projects table
-- - Prevents unauthorized access to other users' projects even if user_id is known
-- - Example attack prevented: user A cannot upload to {userA_id}/{userB_project_id}/...
-- ============================================================================

-- Enable RLS on storage.objects (should already be enabled by default)
-- This is a safety measure
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy 1: Allow authenticated users to upload files to their own folders
-- Pattern: {user_id}/{project_id}/bom-items/{bom_item_id}/{file_type}/{file}
-- Security: Validates ownership of both user_id AND project_id
-- ============================================================================
CREATE POLICY "Users can upload files to their own folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bom-files' AND
  -- The file path must start with the user's UUID
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Verify the user owns the project (prevents unauthorized project access)
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = (storage.foldername(name))[2]::uuid
    AND user_id = auth.uid()
  )
);

-- ============================================================================
-- Policy 2: Allow authenticated users to read files from their own folders
-- Security: Validates ownership of both user_id AND project_id
-- ============================================================================
CREATE POLICY "Users can read files from their own folders"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Verify the user owns the project (prevents unauthorized project access)
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = (storage.foldername(name))[2]::uuid
    AND user_id = auth.uid()
  )
);

-- ============================================================================
-- Policy 3: Allow authenticated users to update files in their own folders
-- Security: Validates ownership of both user_id AND project_id
-- ============================================================================
CREATE POLICY "Users can update files in their own folders"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Verify the user owns the project (prevents unauthorized project access)
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = (storage.foldername(name))[2]::uuid
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Verify the user owns the project (prevents unauthorized project access)
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = (storage.foldername(name))[2]::uuid
    AND user_id = auth.uid()
  )
);

-- ============================================================================
-- Policy 4: Allow authenticated users to delete files from their own folders
-- Security: Validates ownership of both user_id AND project_id
-- ============================================================================
CREATE POLICY "Users can delete files from their own folders"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bom-files' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  -- Verify the user owns the project (prevents unauthorized project access)
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = (storage.foldername(name))[2]::uuid
    AND user_id = auth.uid()
  )
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
'Industry standard: Users can only upload files to folders starting with their UUID AND must own the project';

COMMENT ON POLICY "Users can read files from their own folders" ON storage.objects IS
'Industry standard: Users can only read files from their own folders AND must own the project';

COMMENT ON POLICY "Users can update files in their own folders" ON storage.objects IS
'Industry standard: Users can only update files in their own folders AND must own the project';

COMMENT ON POLICY "Users can delete files from their own folders" ON storage.objects IS
'Industry standard: Users can only delete files from their own folders AND must own the project';

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
