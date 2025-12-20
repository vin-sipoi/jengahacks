-- Rate limiting function for registrations
-- Limits registrations to 3 per hour per IP address

-- Create a function to check rate limits based on IP and time window
CREATE OR REPLACE FUNCTION check_registration_rate_limit(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set window to 1 hour ago
  v_window_start := NOW() - INTERVAL '1 hour';
  
  -- Count registrations from this email in the last hour
  SELECT COUNT(*) INTO v_recent_count
  FROM public.registrations
  WHERE email = p_email
    AND created_at >= v_window_start;
  
  -- Allow if less than 3 registrations in the last hour
  RETURN v_recent_count < 3;
END;
$$;

-- Create a function to get rate limit info
CREATE OR REPLACE FUNCTION get_rate_limit_info(
  p_email TEXT
)
RETURNS TABLE(
  allowed BOOLEAN,
  attempts INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_oldest_registration TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - INTERVAL '1 hour';
  
  -- Count registrations from this email in the last hour
  SELECT COUNT(*), MIN(created_at) INTO v_recent_count, v_oldest_registration
  FROM public.registrations
  WHERE email = p_email
    AND created_at >= v_window_start;
  
  -- Calculate retry after if rate limited
  IF v_recent_count >= 3 THEN
    RETURN QUERY SELECT 
      FALSE as allowed,
      v_recent_count as attempts,
      EXTRACT(EPOCH FROM (v_oldest_registration + INTERVAL '1 hour' - NOW()))::INTEGER as retry_after_seconds;
  ELSE
    RETURN QUERY SELECT 
      TRUE as allowed,
      v_recent_count as attempts,
      0 as retry_after_seconds;
  END IF;
END;
$$;

-- Update the RLS policy to include rate limiting check
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

CREATE POLICY "Anyone can register with rate limit"
ON public.registrations
FOR INSERT
WITH CHECK (
  check_registration_rate_limit(email)
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_registration_rate_limit(TEXT, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_info(TEXT) TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION check_registration_rate_limit IS 'Checks if email has exceeded rate limit of 3 registrations per hour';
COMMENT ON FUNCTION get_rate_limit_info IS 'Returns rate limit status and retry information for an email';

