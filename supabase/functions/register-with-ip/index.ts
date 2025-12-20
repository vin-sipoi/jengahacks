// Supabase Edge Function to handle registration with IP capture
// This function captures the client IP and inserts the registration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegistrationData {
  full_name: string;
  email: string;
  linkedin_url?: string | null;
  resume_path?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    } catch {
      // If IP parsing fails, set to null (will skip IP-based rate limiting)
      ipAddress = null;
    }

    const { full_name, email, linkedin_url, resume_path }: RegistrationData =
      await req.json();

    // Validate required fields
    if (!full_name || !email) {
      return new Response(
        JSON.stringify({ error: "full_name and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert registration with IP address
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        linkedin_url: linkedin_url || null,
        resume_path: resume_path || null,
        ip_address: ipAddress,
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
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour.",
            code: "RATE_LIMIT_EXCEEDED",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check for duplicate email
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({
            error: "This email is already registered",
            code: "DUPLICATE_EMAIL",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          email: data.email,
          // Don't expose IP address in response
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

