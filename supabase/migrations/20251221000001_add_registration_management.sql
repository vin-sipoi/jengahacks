-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Add registration management functionality
-- This migration adds token-based access and cancellation support

-- Add status field (active, cancelled)
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'cancelled'));

-- Add unique access token for registration management
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

-- Generate access tokens for existing registrations
UPDATE public.registrations 
SET access_token = replace(gen_random_uuid()::text, '-', '')
WHERE access_token IS NULL;

-- Create trigger to automatically generate access token for new registrations
CREATE OR REPLACE FUNCTION set_access_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.access_token IS NULL THEN
    NEW.access_token := replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_registration_access_token
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION set_access_token();

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_registrations_access_token 
ON public.registrations(access_token) 
WHERE access_token IS NOT NULL;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_registrations_status 
ON public.registrations(status, created_at);

-- Function to generate a new access token
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Generate a URL-safe base64 token (32 bytes = 44 characters)
  RETURN replace(gen_random_uuid()::text, '-', '')
    -- Replace URL-unsafe characters
    || substring(md5(random()::text), 1, 8);
END;
$$;

-- Function to get registration by token
CREATE OR REPLACE FUNCTION get_registration_by_token(p_token TEXT)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email TEXT,
  whatsapp_number TEXT,
  linkedin_url TEXT,
  resume_path TEXT,
  is_waitlist BOOLEAN,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name,
    r.email,
    r.whatsapp_number,
    r.linkedin_url,
    r.resume_path,
    r.is_waitlist,
    r.status,
    r.created_at
  FROM public.registrations r
  WHERE r.access_token = p_token
    AND r.status = 'active';
END;
$$;

-- Function to update registration by token
CREATE OR REPLACE FUNCTION update_registration_by_token(
  p_token TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_whatsapp_number TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_resume_path TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_registration_id UUID;
BEGIN
  -- Get registration ID by token
  SELECT id INTO v_registration_id
  FROM public.registrations
  WHERE access_token = p_token
    AND status = 'active';
  
  IF v_registration_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update only provided fields
  UPDATE public.registrations
  SET 
    full_name = COALESCE(p_full_name, full_name),
    whatsapp_number = COALESCE(p_whatsapp_number, whatsapp_number),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    resume_path = COALESCE(p_resume_path, resume_path)
  WHERE id = v_registration_id;
  
  RETURN TRUE;
END;
$$;

-- Function to cancel registration by token
CREATE OR REPLACE FUNCTION cancel_registration_by_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_registration_id UUID;
BEGIN
  -- Get registration ID by token
  SELECT id INTO v_registration_id
  FROM public.registrations
  WHERE access_token = p_token
    AND status = 'active';
  
  IF v_registration_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update status to cancelled
  UPDATE public.registrations
  SET status = 'cancelled'
  WHERE id = v_registration_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_access_token() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_registration_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_registration_by_token(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_registration_by_token(TEXT) TO anon, authenticated;

-- Update RLS policies to allow reading own registration via token
DROP POLICY IF EXISTS "Users cannot read registrations" ON public.registrations;

-- Allow reading registration if you have the access token (via function)
-- Direct SELECT is still blocked, but users can use the function
CREATE POLICY "Users cannot read registrations directly"
ON public.registrations
FOR SELECT
USING (false);

-- Allow updating registration via function (handled by SECURITY DEFINER function)
-- Direct UPDATE is still blocked
CREATE POLICY "Users cannot update registrations directly"
ON public.registrations
FOR UPDATE
USING (false);

-- Allow cancelling registration via function (handled by SECURITY DEFINER function)
-- Direct UPDATE to status is still blocked
CREATE POLICY "Users cannot delete registrations"
ON public.registrations
FOR DELETE
USING (false);

