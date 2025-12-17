-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  linkedin_url TEXT,
  resume_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration)
CREATE POLICY "Anyone can register"
ON public.registrations
FOR INSERT
WITH CHECK (true);

-- Only allow reading own registration (by email - for future use)
CREATE POLICY "Users cannot read registrations"
ON public.registrations
FOR SELECT
USING (false);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Allow anyone to upload resumes
CREATE POLICY "Anyone can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Prevent public access to resumes
CREATE POLICY "No public access to resumes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes' AND false);