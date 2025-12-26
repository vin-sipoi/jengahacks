import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCORS, createResponse, createErrorResponse } from "../_shared/utils.ts";

interface GetResumeUrlRequest {
  resume_path: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header - REQUIRED for authenticated access
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      console.error("No authorization header provided");
      return createErrorResponse("Unauthorized - Authentication required", 401);
    }

    // Verify Supabase Auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user found");
      return createErrorResponse("Unauthorized - Invalid token", 401);
    }

    // Check if user has admin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error checking admin role:", rolesError.message);
      return createErrorResponse("Error verifying permissions", 500);
    }

    if (!roles || roles.length === 0) {
      console.error("User does not have admin role:", user.id);
      return createErrorResponse("Forbidden - Admin access required", 403);
    }

    // Parse request body
    const { resume_path }: GetResumeUrlRequest = await req.json();

    if (!resume_path || typeof resume_path !== "string") {
      return createErrorResponse("Invalid request - resume_path required", 400);
    }

    // Verify the resume exists and belongs to a registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from("registrations")
      .select("id, resume_path")
      .eq("resume_path", resume_path)
      .single();

    if (regError || !registration) {
      console.error("Resume not found:", resume_path);
      return createErrorResponse("Resume not found", 404);
    }

    // Generate signed URL with 1 hour expiration
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(resume_path, 3600); // 1 hour expiration

    if (urlError || !signedUrlData) {
      console.error("Error creating signed URL:", urlError);
      return createErrorResponse("Failed to generate download URL", 500);
    }

    console.log("Resume URL generated for admin:", user.email);

    return createResponse({
      success: true,
      url: signedUrlData.signedUrl,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error in get-resume-url function:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
});
