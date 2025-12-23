export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function handleCORS(req: Request) {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    return null;
}

export function createResponse(body: any, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export function createErrorResponse(error: string, status = 500, code?: string) {
    return createResponse({ error, code }, status);
}
