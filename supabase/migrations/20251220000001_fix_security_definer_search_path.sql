-- Fix SECURITY DEFINER search_path vulnerability
-- This migration addresses the DEFINER_OR_RPC_BYPASS security issue
-- by setting search_path to empty string for all SECURITY DEFINER functions
-- This prevents search_path manipulation attacks

-- Fix check_registration_rate_limit function
CREATE OR REPLACE FUNCTION check_registration_rate_limit(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email_count INTEGER;
  v_ip_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set window to 1 hour ago
  v_window_start := NOW() - INTERVAL '1 hour';
  
  -- Count registrations from this email in the last hour
  SELECT COUNT(*) INTO v_email_count
  FROM public.registrations
  WHERE email = p_email
    AND created_at >= v_window_start;
  
  -- Check email limit (3 per hour)
  IF v_email_count >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Check IP limit if IP is provided (5 per hour)
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_count
    FROM public.registrations
    WHERE ip_address = p_ip_address
      AND created_at >= v_window_start;
    
    IF v_ip_count >= 5 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Both checks passed
  RETURN TRUE;
END;
$$;

-- Fix get_rate_limit_info function
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
SET search_path = ''
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

-- Fix check_ip_rate_limit function
CREATE OR REPLACE FUNCTION check_ip_rate_limit(
  p_ip_address INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_recent_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Return true if IP is NULL (for backward compatibility)
  IF p_ip_address IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Set window to 1 hour ago
  v_window_start := NOW() - INTERVAL '1 hour';
  
  -- Count registrations from this IP in the last hour
  SELECT COUNT(*) INTO v_recent_count
  FROM public.registrations
  WHERE ip_address = p_ip_address
    AND created_at >= v_window_start;
  
  -- Allow if less than 5 registrations per hour per IP (more lenient than email limit)
  RETURN v_recent_count < 5;
END;
$$;

-- Fix get_ip_rate_limit_info function
CREATE OR REPLACE FUNCTION get_ip_rate_limit_info(
  p_ip_address INET
)
RETURNS TABLE(
  allowed BOOLEAN,
  attempts INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_recent_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_oldest_registration TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_ip_address IS NULL THEN
    RETURN QUERY SELECT TRUE as allowed, 0 as attempts, 0 as retry_after_seconds;
    RETURN;
  END IF;

  v_window_start := NOW() - INTERVAL '1 hour';
  
  -- Count registrations from this IP in the last hour
  SELECT COUNT(*), MIN(created_at) INTO v_recent_count, v_oldest_registration
  FROM public.registrations
  WHERE ip_address = p_ip_address
    AND created_at >= v_window_start;
  
  -- Calculate retry after if rate limited (5 per hour limit)
  IF v_recent_count >= 5 THEN
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

-- Update function comments to document security fix
COMMENT ON FUNCTION check_registration_rate_limit IS 'Checks if email (3/hour) or IP (5/hour) has exceeded rate limit. Uses SECURITY DEFINER with SET search_path = '' to prevent search_path manipulation attacks.';
COMMENT ON FUNCTION get_rate_limit_info IS 'Returns rate limit status and retry information for an email. Uses SECURITY DEFINER with SET search_path = '' to prevent search_path manipulation attacks.';
COMMENT ON FUNCTION check_ip_rate_limit IS 'Checks if IP address has exceeded rate limit of 5 registrations per hour. Uses SECURITY DEFINER with SET search_path = '' to prevent search_path manipulation attacks.';
COMMENT ON FUNCTION get_ip_rate_limit_info IS 'Returns IP-based rate limit status and retry information. Uses SECURITY DEFINER with SET search_path = '' to prevent search_path manipulation attacks.';


