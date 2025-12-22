-- Secure resume file access
-- This migration addresses the EXPOSED_SENSITIVE_DATA security issue
-- by implementing proper access controls for resume files

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "No public access to resumes" ON storage.objects;

-- Allow anyone to upload resumes (for registration)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Deny all SELECT operations by default (no public access)
-- This prevents direct URL access to resume files
CREATE POLICY "Deny all resume downloads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes' AND false);

-- Note: Admin access to resumes should be handled via:
-- 1. Supabase service role (bypasses RLS) - for backend/admin operations
-- 2. Signed URLs with expiration - for secure temporary access
-- 3. Edge Function with authentication - for controlled access

-- Update bucket configuration to ensure it's private
UPDATE storage.buckets
SET public = false
WHERE id = 'resumes';

-- Add comment for documentation
COMMENT ON POLICY "Deny all resume downloads" ON storage.objects IS 
  'Prevents public access to resume files. Access must be granted via service role or signed URLs.';


