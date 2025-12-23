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

export const registrationService = {
  /**
   * Check if registration should be added to waitlist
   */
  async checkWaitlist(): Promise<{ shouldWaitlist: boolean; error?: Error }> {
    try {
      const { data: shouldWaitlist, error: waitlistCheckError } = await callRpc(
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
      const { data: accessToken, error: tokenError } = await callRpc("generate_access_token", {});

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
      const { data: registrationData, error: insertError } = await supabase
        .from("registrations")
        .insert({
          full_name: data.fullName,
          email: data.email,
          whatsapp_number: data.whatsapp || null,
          linkedin_url: data.linkedIn || null,
          resume_path: data.resumePath || null,
          is_waitlist: isWaitlist,
          access_token: accessToken || undefined,
        })
        .select("id")
        .single();

      if (insertError) {
        logger.error(
          "Registration insert error",
          insertError instanceof Error ? insertError : new Error(String(insertError)),
          { email: data.email, fullName: data.fullName }
        );
        return { registrationId: null, error: insertError };
      }

      return { registrationId: registrationData?.id || null };
    } catch (error) {
      logger.error(
        "Registration insert error",
        error instanceof Error ? error : new Error(String(error)),
        { email: data.email, fullName: data.fullName }
      );
      return {
        registrationId: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  /**
   * Get waitlist position for email
   */
  async getWaitlistPosition(email: string): Promise<number | null> {
    try {
      const { data: position, error: positionError } = await callRpc("get_waitlist_position", {
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
      const linkedIn = formData.linkedIn.trim() || null;

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
        // Check for rate limit violation
        if (
          insertError.message?.includes("rate limit") ||
          insertError.message?.includes("too many")
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

