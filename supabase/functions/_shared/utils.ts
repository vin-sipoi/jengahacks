/**
 * Security headers for all responses
 */
const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Get CORS headers based on request origin
 * Only allows origins from environment variable or Supabase domains
 */
function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get("origin");
    const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map(o => o.trim()) || [];
    
    // Allow Supabase project domains by default
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseDomain = supabaseUrl.replace(/^https?:\/\//, "").split("/")[0];
    
    // Check if origin is allowed
    let allowedOrigin = "null";
    if (origin) {
        // Allow if in allowed origins list
        if (allowedOrigins.includes(origin)) {
            allowedOrigin = origin;
        }
        // Allow if from same Supabase project domain
        else if (origin.includes(supabaseDomain)) {
            allowedOrigin = origin;
        }
        // In development, allow localhost
        else if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
            allowedOrigin = origin;
        }
    }
    
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Max-Age": "86400", // 24 hours
        ...securityHeaders,
    };
}

/**
 * Handles CORS preflight requests.
 */
export function handleCORS(req: Request) {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: getCorsHeaders(req)
        });
    }
    return null;
}

/**
 * Creates a standard JSON response with CORS and security headers.
 */
export function createResponse(body: unknown, status = 200, req?: Request) {
    const headers = req ? getCorsHeaders(req) : {
        "Access-Control-Allow-Origin": "*", // Fallback if no request context
        ...securityHeaders,
    };
    
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...headers,
            "Content-Type": "application/json"
        },
    });
}

/**
 * Creates a standard JSON error response with CORS headers.
 * Uses generic error messages to prevent information leakage.
 */
export function createErrorResponse(error: string, status = 500, code?: string, req?: Request) {
    // Generic error messages for client (detailed errors logged server-side)
    let clientError = error;
    
    // Don't expose internal details
    if (status >= 500) {
        clientError = "An error occurred. Please try again later.";
    }
    
    // Log detailed error server-side
    if (status >= 500 || code) {
        console.error(`[Error ${status}${code ? ` ${code}` : ""}]`, error);
    }
    
    return createResponse({
        success: false,
        error: clientError,
        code: code || undefined
    }, status, req);
}
