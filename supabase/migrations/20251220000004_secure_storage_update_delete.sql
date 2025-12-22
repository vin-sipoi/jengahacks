-- Add explicit storage policies to protect against UPDATE and DELETE operations
-- This migration addresses the STORAGE_EXPOSURE security issue
-- by explicitly denying UPDATE and DELETE operations for resume files

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Deny all resume updates" ON storage.objects;
DROP POLICY IF EXISTS "Deny all resume deletes" ON storage.objects;

-- Explicitly deny UPDATE operations for all users
-- This prevents anyone from modifying resume files
CREATE POLICY "Deny all resume updates"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resumes' AND false)
WITH CHECK (bucket_id = 'resumes' AND false);

-- Explicitly deny DELETE operations for all users
-- This prevents anyone from deleting resume files
CREATE POLICY "Deny all resume deletes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resumes' AND false);

-- Add comments for documentation
COMMENT ON POLICY "Deny all resume updates" ON storage.objects IS 
  'Explicitly denies all UPDATE operations on resume files. Resume files are immutable once uploaded.';
COMMENT ON POLICY "Deny all resume deletes" ON storage.objects IS 
  'Explicitly denies all DELETE operations on resume files. Resume files cannot be deleted by users.';


