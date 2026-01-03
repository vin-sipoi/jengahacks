// Supabase Edge Function to handle registration with IP capture
// This function captures the client IP and inserts the registration record into Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCORS, createResponse, createErrorResponse } from "../_shared/utils.ts";

interface RegistrationData {
  full_name: string;
  email: string;
  whatsapp_number?: string | null;
  linkedin_url?: string | null;
  resume_path?: string | null;
  is_waitlist?: boolean;
  access_token?: string;
}

/**
 * Validate IPv4 or IPv6 address
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex: 0.0.0.0 to 255.255.255.255
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified - allows compressed format)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validate WhatsApp number format
 */
function isValidWhatsAppNumber(phone: string | null | undefined): boolean {
  if (!phone || phone.trim().length === 0) {
    return false;
  }
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate LinkedIn URL format
 */
function isValidLinkedInUrl(url: string | null | undefined): boolean {
  if (!url || url.trim().length === 0) {
    return true; // Optional field
  }
  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;
  return linkedinRegex.test(url.trim());
}

serve(async (req: Request) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Get client IP from request headers
    // Supabase provides the real IP in x-forwarded-for or x-real-ip headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Parse and validate IP address (handle IPv4 and IPv6)
    let ipAddress: string | null = null;
    try {
      // Validate IP address format
      if (clientIp !== "unknown" && isValidIP(clientIp)) {
        ipAddress = clientIp;
      }
    } catch (error) {
      // If IP parsing fails, set to null (will skip IP-based rate limiting)
      // Log error for debugging but don't fail the request
      console.error('[register-with-ip] Failed to parse IP address:', error);
      ipAddress = null;
    }

    const { full_name, email, whatsapp_number, linkedin_url, resume_path, is_waitlist, access_token }: RegistrationData =
      await req.json();

    // Comprehensive input validation
    if (!full_name || typeof full_name !== "string") {
      return createErrorResponse("Full name is required", 400, "VALIDATION_ERROR", req);
    }
    
    if (full_name.length < 2 || full_name.length > 100) {
      return createErrorResponse("Full name must be between 2 and 100 characters", 400, "VALIDATION_ERROR", req);
    }
    
    if (!email || typeof email !== "string") {
      return createErrorResponse("Email is required", 400, "VALIDATION_ERROR", req);
    }
    
    if (!isValidEmail(email)) {
      return createErrorResponse("Invalid email format", 400, "VALIDATION_ERROR", req);
    }
    
    if (email.length > 254) {
      return createErrorResponse("Email is too long", 400, "VALIDATION_ERROR", req);
    }
    
    if (whatsapp_number !== null && whatsapp_number !== undefined && !isValidWhatsAppNumber(whatsapp_number)) {
      return createErrorResponse("Invalid WhatsApp number format", 400, "VALIDATION_ERROR", req);
    }
    
    if (linkedin_url !== null && linkedin_url !== undefined && !isValidLinkedInUrl(linkedin_url)) {
      return createErrorResponse("Invalid LinkedIn URL format", 400, "VALIDATION_ERROR", req);
    }
    
    if (resume_path !== null && resume_path !== undefined) {
      if (typeof resume_path !== "string" || resume_path.length > 255) {
        return createErrorResponse("Invalid resume path", 400, "VALIDATION_ERROR", req);
      }
      // Validate resume path format (should be sanitized filename)
      if (!/^[\d]+-[a-zA-Z0-9]+\.pdf$/.test(resume_path)) {
        return createErrorResponse("Invalid resume path format", 400, "VALIDATION_ERROR", req);
      }
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if identifier is blocked
    const emailBlocked = await supabase.rpc("is_identifier_blocked", {
      p_identifier: email.toLowerCase().trim(),
      p_violation_type: "email",
    });
    
    if (emailBlocked.data === true) {
      return createErrorResponse("Registration blocked due to rate limit violations", 429);
    }

    if (ipAddress && ipAddress !== "unknown") {
      const ipBlocked = await supabase.rpc("is_identifier_blocked", {
        p_identifier: ipAddress,
        p_violation_type: "ip",
      });
      
      if (ipBlocked.data === true) {
        return createErrorResponse("Registration blocked due to rate limit violations", 429);
      }
    }

    // Check if registration should go to waitlist (if not already specified)
    let shouldWaitlist = is_waitlist;
    if (shouldWaitlist === undefined) {
      const { data: waitlistCheck } = await supabase.rpc("should_add_to_waitlist");
      shouldWaitlist = waitlistCheck === true;
    }

    // Insert registration with IP address
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        whatsapp_number: whatsapp_number || null,
        linkedin_url: linkedin_url || null,
        resume_path: resume_path || null,
        ip_address: ipAddress,
        is_waitlist: shouldWaitlist || false,
        access_token: access_token || null,
      })
      .select()
      .single();

    if (error) {
      // Check for rate limit errors
      if (
        error.message?.includes("policy") ||
        error.message?.includes("rate limit") ||
        error.code === "42501"
      ) {
        // Log violation to database (non-blocking)
        try {
          // Get rate limit info to determine violation type and count
          const { data: emailLimitInfo } = await supabase.rpc("get_rate_limit_info", {
            p_email: email.toLowerCase().trim(),
          });
          
          const { data: ipLimitInfo } = ipAddress
            ? await supabase.rpc("get_ip_rate_limit_info", { p_ip_address: ipAddress })
            : { data: null };

          // Determine which limit was exceeded
          if (emailLimitInfo && emailLimitInfo.length > 0 && !emailLimitInfo[0].allowed) {
            // Email limit exceeded
            await supabase.rpc("log_email_rate_limit_violation", {
              p_email: email.toLowerCase().trim(),
              p_attempt_count: emailLimitInfo[0].attempts,
              p_user_agent: req.headers.get("user-agent") || null,
              p_request_path: "/functions/v1/register-with-ip",
            });
          } else if (ipLimitInfo && ipLimitInfo.length > 0 && !ipLimitInfo[0].allowed) {
            // IP limit exceeded
            await supabase.rpc("log_ip_rate_limit_violation", {
              p_ip_address: ipAddress,
              p_attempt_count: ipLimitInfo[0].attempts,
              p_user_agent: req.headers.get("user-agent") || null,
              p_request_path: "/functions/v1/register-with-ip",
            });
          }
        } catch (logError) {
          // Don't fail the request if logging fails
          console.error("[register-with-ip] Failed to log rate limit violation:", logError);
        }

        return createErrorResponse(
          "Rate limit exceeded. Please try again later.",
          429,
          "RATE_LIMIT_EXCEEDED",
          req
        );
      }

      // Check for duplicate email
      if (error.code === "23505") {
        return createErrorResponse("This email is already registered", 409, "DUPLICATE_EMAIL", req);
      }

      // Generic error for all other cases
      return createErrorResponse("An error occurred processing your registration", 500, error.code, req);
    }

    return createResponse({
      success: true,
      data: {
        id: data.id,
        email: data.email,
      },
    }, 200, req);
  } catch (error) {
    return createErrorResponse("An error occurred processing your request", 500, undefined, req);
  }
});

