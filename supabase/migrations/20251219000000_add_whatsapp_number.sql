-- Add WhatsApp number column to registrations table

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.registrations.whatsapp_number IS 'WhatsApp number for contacting registrants';

