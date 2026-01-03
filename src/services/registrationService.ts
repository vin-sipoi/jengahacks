/**
 * Registration service for handling registration submission logic
 */

import { logger } from "@/lib/logger";
import { trackRegistration } from "@/lib/analytics";
import { markIncompleteRegistrationCompleted } from "@/lib/incompleteRegistration";
import {
  RegistrationResult,
  RegistrationSubmissionData,
  RegistrationFormData
} from "@/types/registration";
import { callRpc } from "@/lib/supabaseRpc";
import { supabase } from "@/integrations/supabase/client";
import { validateAndNormalizeLinkedIn } from "@/lib/security";

// TODO: Extract common error handling patterns into utility functions
export const registrationService = {
  /**
   * Check if email already exists in the database
   * Returns true if email exists, false otherwise
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; error?: Error }> {
    try {
      const { data, error } = await callRpc<boolean>("email_exists", {
        p_email: email.trim().toLowerCase(),
      });

      if (error) {
        // If function doesn't exist yet, return false (graceful degradation)
        // This allows the form to work even if migration hasn't been run
        logger.warn("Email check function not available", {
          error: error instanceof Error ? error.message : String(error),
        });
        return { exists: false };
      }

      return { exists: data === true };
    } catch (error) {
      // Graceful degradation - if check fails, allow form submission
      // Server-side validation will catch duplicates
      logger.warn("Email existence check failed", {
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      return { exists: false };
    }
  },

  /**
   * Check if registration should be added to waitlist
   */
  async checkWaitlist(): Promise<{ shouldWaitlist: boolean; error?: Error }> {
    try {
      const { data: shouldWaitlist, error: waitlistCheckError } = await callRpc<boolean>(
        "should_add_to_waitlist",
        {}
      );

      if (waitlistCheckError) {
        logger.error("Waitlist check error", waitlistCheckError, {});
        return { shouldWaitlist: false, error: waitlistCheckError };
      }

      return { shouldWaitlist: shouldWaitlist === true };
    } catch (error) {
      logger.error(
        "Waitlist check error",
        error instanceof Error ? error : new Error(String(error)),
        {}
      );
      return {
        shouldWaitlist: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  /**
   * Generate access token for registration management
   */
  async generateAccessToken(): Promise<{ token: string | null; error?: Error }> {
    try {
      const { data: accessToken, error: tokenError } = await callRpc<string>("generate_access_token", {});

      if (tokenError) {
        logger.error("Access token generation error", tokenError, {});
        return { token: null, error: tokenError };
      }

      return { token: (accessToken as string) || null };
    } catch (error) {
      logger.error(
        "Access token generation error",
        error instanceof Error ? error : new Error(String(error)),
        {}
      );
      return {
        token: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  /**
   * Submit registration to database
   */
  async submitRegistration({
    data,
    isWaitlist,
    accessToken,
  }: {
    data: RegistrationSubmissionData;
    isWaitlist: boolean;
    accessToken: string | null;
  }): Promise<{ registrationId: string | null; error?: Error }> {
    try {
      // Check if Edge Function is enabled
      const useEdgeFunction = import.meta.env.VITE_USE_REGISTRATION_EDGE_FUNCTION === "true";
      
      if (!useEdgeFunction) {
        const error = new Error(
          "Edge Function registration is disabled. Please set VITE_USE_REGISTRATION_EDGE_FUNCTION=true in your environment variables."
        );
        logger.error("Edge Function disabled", error, { email: data.email, fullName: data.fullName });
        return { registrationId: null, error };
      }

      // Log the request details for debugging
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const hasAnonKey = !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      logger.info("Calling Edge Function", {
        functionName: "register-with-ip",
        supabaseUrl,
        hasAnonKey,
        email: data.email,
        expectedUrl: supabaseUrl ? `${supabaseUrl}/functions/v1/register-with-ip` : "unknown",
      });

      // Validate configuration before making request
      if (!supabaseUrl) {
        const error = new Error("VITE_SUPABASE_URL is not set. Please check your .env file and restart the dev server.");
        logger.error("Missing Supabase URL", error, { email: data.email });
        return { registrationId: null, error };
      }

      if (!hasAnonKey) {
        const error = new Error("VITE_SUPABASE_PUBLISHABLE_KEY is not set. Please check your .env file and restart the dev server.");
        logger.error("Missing Supabase API key", error, { email: data.email });
        return { registrationId: null, error };
      }

      let registrationData;
      let insertError;
      
      try {
        // Log the exact URL we're calling for debugging
        const functionUrl = `${supabaseUrl}/functions/v1/register-with-ip`;
        logger.info("Invoking Edge Function", {
          functionUrl,
          email: data.email,
          hasBody: true,
        });

        const result = await supabase.functions.invoke(
          "register-with-ip",
          {
            body: {
              full_name: data.fullName,
              email: data.email,
              whatsapp_number: data.whatsapp || null,
              linkedin_url: data.linkedIn || null,
              resume_path: data.resumePath || null,
              is_waitlist: isWaitlist,
              access_token: accessToken || undefined,
            },
          }
        );
        registrationData = result.data;
        insertError = result.error;
      } catch (fetchError) {
        // Handle fetch errors (network issues, CORS, etc.)
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorStack = fetchError instanceof Error ? fetchError.stack : undefined;
        
        // Enhanced error logging with more context
        logger.error("Edge Function fetch error", fetchError instanceof Error ? fetchError : new Error(String(fetchError)), {
          email: data.email,
          fullName: data.fullName,
          supabaseUrl,
          functionUrl: `${supabaseUrl}/functions/v1/register-with-ip`,
          errorMessage,
          errorStack,
          errorType: fetchError instanceof TypeError ? "TypeError" : typeof fetchError,
          isNetworkError: errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError"),
          isCorsError: errorMessage.includes("CORS") || errorMessage.includes("cors"),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        });
        
        // Provide user-friendly error message
        let userMessage = "Network error: Unable to connect to the registration service.";
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
          userMessage = "Network error: Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.";
        } else if (errorMessage.includes("CORS") || errorMessage.includes("cors")) {
          userMessage = "Connection error: Please check your browser settings or try a different browser.";
        } else if (errorMessage.includes("timeout")) {
          userMessage = "Request timeout: The service took too long to respond. Please try again.";
        }
        
        return { 
          registrationId: null, 
          error: new Error(userMessage) 
        };
      }

      // Check response data first - even if there's an error, the response body may contain useful info
      if (registrationData && !registrationData.success) {
        // Extract error message and code from response
        const errorMessage = registrationData.error || "Registration failed";
        const errorCode = registrationData.code;
        
        // Handle specific error codes
        if (errorCode === "DUPLICATE_EMAIL" || errorMessage.toLowerCase().includes("already registered")) {
          const duplicateError = new Error("This email is already registered");
          logger.warn("Duplicate email registration attempt", { 
            error: duplicateError.message,
            email: data.email 
          });
          return { registrationId: null, error: duplicateError };
        }
        
        if (errorCode === "RATE_LIMIT_EXCEEDED" || errorMessage.toLowerCase().includes("rate limit")) {
          const rateLimitError = new Error("Rate limit exceeded. Please try again later.");
          logger.warn("Rate limit exceeded", { 
            error: rateLimitError.message,
            email: data.email 
          });
          return { registrationId: null, error: rateLimitError };
        }
        
        // Generic error from response
        const error = new Error(errorMessage);
        logger.error("Registration function error", error, { email: data.email, fullName: data.fullName, code: errorCode });
        return { registrationId: null, error };
      }

      // Handle function error structure (which might wrap errors)
      if (insertError) {
        // Provide more descriptive error messages
        let errorMessage = "Failed to send a request to the Edge Function when registering";
        
        // Extract error details
        const errorDetails: Record<string, unknown> = {
          email: data.email,
          fullName: data.fullName,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        };

        // Try to extract more information from the error
        if (insertError.message) {
          errorMessage = insertError.message;
          errorDetails.originalMessage = insertError.message;
        } else if (typeof insertError === "string") {
          errorMessage = insertError;
          errorDetails.originalError = insertError;
        } else if (insertError instanceof Error) {
          errorMessage = insertError.message;
          errorDetails.originalError = insertError;
        }

        // Check for Supabase-specific error properties
        if (insertError && typeof insertError === "object") {
          const errorObj = insertError as Record<string, unknown>;
          if (errorObj.status) errorDetails.status = errorObj.status;
          if (errorObj.statusCode) errorDetails.statusCode = errorObj.statusCode;
          if (errorObj.context) errorDetails.context = errorObj.context;
          if (errorObj.name) errorDetails.errorName = errorObj.name;
          // Log the full error object for debugging
          errorDetails.fullError = JSON.stringify(insertError, Object.getOwnPropertyNames(insertError));
        }

        // Check for common error scenarios
        if (errorMessage.includes("409") || errorDetails.status === 409 || errorDetails.statusCode === 409) {
          // 409 Conflict - likely duplicate email
          errorMessage = "This email is already registered";
          errorDetails.isDuplicateEmail = true;
        } else if (errorMessage.includes("404") || errorMessage.includes("not found") || errorDetails.status === 404) {
          errorMessage = "Edge Function not found. Please ensure the 'register-with-ip' Edge Function is deployed.";
        } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorDetails.status === 401) {
          errorMessage = "Authentication failed. Please check your Supabase API key configuration.";
        } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorDetails.status === 403) {
          errorMessage = "Access forbidden. Please check your Supabase permissions.";
        } else if (errorMessage.includes("429") || errorMessage.includes("rate limit") || errorDetails.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (errorMessage.includes("CORS") || errorMessage.includes("cors")) {
          errorMessage = "CORS error when calling Edge Function. Please check Edge Function CORS configuration.";
        } else if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch")) {
          errorMessage = "Network error when calling Edge Function. Please check your internet connection and Supabase configuration.";
        } else if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
          errorMessage = "Request timeout. The Edge Function took too long to respond. Please try again.";
        }

        const error = new Error(errorMessage);
        logger.error(
          "Registration insert error",
          error,
          errorDetails
        );
        return { registrationId: null, error };
      }

      return { registrationId: registrationData?.data?.id || null };
    } catch (error) {
      // Handle network errors, timeouts, etc.
      let errorMessage = "Failed to send a request to the Edge Function when registering";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "Network error: Unable to connect to the Edge Function. Please check your internet connection and ensure the Edge Function is deployed.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timeout: The Edge Function took too long to respond. Please try again.";
        }
      }

      const registrationError = new Error(errorMessage);
      logger.error(
        "Registration insert error",
        registrationError,
        { 
          email: data.email, 
          fullName: data.fullName,
          originalError: error,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL
        }
      );
      return {
        registrationId: null,
        error: registrationError,
      };
    }
  },

  /**
   * Get waitlist position for email
   */
  async getWaitlistPosition(email: string): Promise<number | null> {
    try {
      const { data: position, error: positionError } = await callRpc<number>("get_waitlist_position", {
        p_email: email,
      });

      if (!positionError && position !== null && position !== undefined) {
        return position as number;
      }

      return null;
    } catch (error) {
      logger.warn("Failed to get waitlist position", {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  /**
   * Complete registration submission flow
   */
  async submit(
    formData: RegistrationFormData,
    resumePath: string | null
  ): Promise<RegistrationResult> {
    try {
      // Capture and sanitize form data
      const fullName = formData.fullName.trim();
      const email = formData.email.trim().toLowerCase();
      const whatsapp = formData.whatsapp?.trim() || null;
      // Normalize LinkedIn input (username, in/username, or full URL) to full URL
      const linkedInInput = formData.linkedIn.trim();
      const linkedIn = linkedInInput 
        ? validateAndNormalizeLinkedIn(linkedInInput) 
        : null;

      // Check waitlist status
      const { shouldWaitlist, error: waitlistError } = await this.checkWaitlist();
      const isWaitlist = shouldWaitlist;

      // Generate access token
      const { token: accessToken, error: tokenError } = await this.generateAccessToken();

      // Submit registration
      const submissionData: RegistrationSubmissionData = {
        fullName,
        email,
        whatsapp,
        linkedIn,
        resumePath,
      };

      const { registrationId, error: insertError } = await this.submitRegistration({
        data: submissionData,
        isWaitlist,
        accessToken: accessToken || null,
      });

      if (insertError) {
        // Check for duplicate email
        if (
          insertError.message?.includes("already registered") ||
          insertError.message?.includes("duplicate") ||
          insertError.message?.toLowerCase().includes("this email is already registered")
        ) {
          const duplicateError = "This email is already registered";
          trackRegistration(false, duplicateError);
          return {
            success: false,
            error: duplicateError,
          };
        }
        
        // Check for rate limit violation
        if (
          insertError.message?.includes("rate limit") ||
          insertError.message?.includes("too many") ||
          insertError.message?.includes("Rate limit exceeded")
        ) {
          const rateLimitError = "Rate limit exceeded. Please try again later.";
          trackRegistration(false, rateLimitError);
          return {
            success: false,
            error: rateLimitError,
          };
        }

        const errorMessage = insertError.message || "Registration failed";
        trackRegistration(false, errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Get waitlist position if applicable
      let waitlistPosition: number | null = null;
      if (isWaitlist) {
        waitlistPosition = await this.getWaitlistPosition(email);
      }

      // Mark incomplete registration as completed
      if (email) {
        markIncompleteRegistrationCompleted(email).catch((err) => {
          logger.error("Failed to mark incomplete registration as completed", err);
        });
      }

      // Track successful registration
      trackRegistration(true);

      return {
        success: true,
        registrationId: registrationId || undefined,
        accessToken: accessToken || undefined,
        isWaitlist,
        waitlistPosition: waitlistPosition || undefined,
      };
    } catch (error) {
      logger.error(
        "Registration error",
        error instanceof Error ? error : new Error(String(error)),
        { email: formData.email, fullName: formData.fullName }
      );

      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      trackRegistration(false, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

