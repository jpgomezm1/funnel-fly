-- =============================================================================
-- FINANCE RECEIPTS STORAGE BUCKET AND POLICIES
-- Run this in the Supabase SQL Editor
-- =============================================================================

-- 1. Create the storage bucket for finance receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'finance-receipts',
  'finance-receipts',
  false, -- Private bucket (requires auth)
  10485760, -- 10MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload finance receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'finance-receipts');

-- 3. Policy: Allow authenticated users to view/download files
CREATE POLICY "Authenticated users can view finance receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'finance-receipts');

-- 4. Policy: Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update finance receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'finance-receipts')
WITH CHECK (bucket_id = 'finance-receipts');

-- 5. Policy: Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete finance receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'finance-receipts');
