export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Handles CORS preflight requests.
 */
export function handleCORS(req: Request) {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }
    return null;
}

/**
 * Creates a standard JSON response with CORS headers.
 */
export function createResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
        },
    });
}

/**
 * Creates a standard JSON error response with CORS headers.
 */
export function createErrorResponse(error: string, status = 500, code?: string) {
    return createResponse({
        success: false,
        error,
        code
    }, status);
}
