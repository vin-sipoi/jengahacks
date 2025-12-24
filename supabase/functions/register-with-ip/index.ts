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

serve(async (req: Request) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Get client IP from request headers
    // Supabase provides the real IP in x-forwarded-for or x-real-ip headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Parse IP address (handle IPv4 and IPv6)
    let ipAddress: string | null = null;
    try {
      // Validate and normalize IP
      if (clientIp !== "unknown" && clientIp.match(/^[\d.:a-fA-F]+$/)) {
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

    // Validate required fields
    if (!full_name || !email) {
      return createErrorResponse("full_name and email are required", 400);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          "Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour.",
          429,
          "RATE_LIMIT_EXCEEDED"
        );
      }

      // Check for duplicate email
      if (error.code === "23505") {
        return createErrorResponse("This email is already registered", 409, "DUPLICATE_EMAIL");
      }

      return createErrorResponse(error.message, 500, error.code);
    }

    return createResponse({
      success: true,
      data: {
        id: data.id,
        email: data.email,
      },
    });
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
});

