// Supabase Edge Function to verify reCAPTCHA token server-side
// This provides an additional layer of security by verifying the CAPTCHA on the server

// @ts-expect-error - Deno types are available in Supabase Edge Functions runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-expect-error - Deno global is available in Supabase Edge Functions runtime
const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY");

interface VerifyRequest {
  token: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (!RECAPTCHA_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "reCAPTCHA secret key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { token }: VerifyRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "CAPTCHA token is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify token with Google reCAPTCHA API
    const verifyResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
      }
    );

    const verifyData = await verifyResponse.json();

    return new Response(
      JSON.stringify({
        success: verifyData.success,
        score: verifyData.score, // For v3, score indicates bot likelihood
        challenge_ts: verifyData.challenge_ts,
        hostname: verifyData.hostname,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});


