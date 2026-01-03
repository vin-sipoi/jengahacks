import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCORS, createResponse, createErrorResponse } from "../_shared/utils.ts";

const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY");

interface VerifyRequest {
  token: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (!RECAPTCHA_SECRET_KEY) {
      return createErrorResponse("reCAPTCHA secret key not configured", 500, undefined, req);
    }

    const { token }: VerifyRequest = await req.json();

    // Validate input
    if (!token || typeof token !== "string") {
      return createErrorResponse("CAPTCHA token is required", 400, "VALIDATION_ERROR", req);
    }
    
    if (token.length > 2000) {
      return createErrorResponse("Invalid CAPTCHA token format", 400, "VALIDATION_ERROR", req);
    }

    // Verify token with Google reCAPTCHA API
    const verifyResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${encodeURIComponent(token)}`,
      }
    );

    const verifyData = await verifyResponse.json();

    return createResponse({
      success: verifyData.success,
      score: verifyData.score, // For v3, score indicates bot likelihood
      challenge_ts: verifyData.challenge_ts,
      hostname: verifyData.hostname,
    }, 200, req);
  } catch (error) {
    return createErrorResponse("An error occurred verifying CAPTCHA", 500, undefined, req);
  }
});


