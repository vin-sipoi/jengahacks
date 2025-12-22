/**
 * Utility functions for tracking incomplete registrations
 * Logs emails and WhatsApp numbers that are entered but registration is never completed
 */

import { logger } from './logger';
import { callRpc } from './supabaseRpc';

interface IncompleteRegistrationData {
  email?: string;
  whatsappNumber?: string;
  fullName?: string;
  formData?: {
    hasWhatsApp?: boolean;
    hasLinkedIn?: boolean;
    hasResume?: boolean;
  };
}

/**
 * Log an incomplete registration (email or WhatsApp number entered but not completed)
 */
export const logIncompleteRegistration = async (
  data: IncompleteRegistrationData
): Promise<void> => {
  try {
    // Ensure at least email or whatsappNumber is provided
    if (!data.email?.trim() && !data.whatsappNumber?.trim()) {
      return;
    }

    // Get IP address and user agent if available
    const ipAddress = await getClientIP();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

    // Call RPC function to log incomplete registration
    const { error } = await callRpc('log_incomplete_registration', {
      p_email: data.email?.toLowerCase().trim() || null,
      p_whatsapp_number: data.whatsappNumber?.trim() || null,
      p_full_name: data.fullName?.trim() || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
      p_form_data: data.formData ? JSON.stringify(data.formData) : null,
    });

    if (error) {
      logger.warn('Failed to log incomplete registration', { 
        error, 
        email: data.email,
        whatsappNumber: data.whatsappNumber 
      });
    } else {
      logger.debug('Logged incomplete registration', { 
        email: data.email,
        whatsappNumber: data.whatsappNumber 
      });
    }
  } catch (error) {
    // Don't throw - this is non-critical logging
    logger.debug('Error logging incomplete registration', { 
      error, 
      email: data.email,
      whatsappNumber: data.whatsappNumber 
    });
  }
};

/**
 * Mark an incomplete registration as completed
 */
export const markIncompleteRegistrationCompleted = async (
  email?: string,
  whatsappNumber?: string
): Promise<void> => {
  try {
    // Ensure at least email or whatsappNumber is provided
    if (!email?.trim() && !whatsappNumber?.trim()) {
      return;
    }

    const { error } = await callRpc('mark_incomplete_registration_completed', {
      p_email: email?.toLowerCase().trim() || null,
      p_whatsapp_number: whatsappNumber?.trim() || null,
    });

    if (error) {
      logger.debug('Failed to mark incomplete registration as completed', { 
        error, 
        email,
        whatsappNumber 
      });
    }
  } catch (error) {
    // Don't throw - this is non-critical
    logger.debug('Error marking incomplete registration as completed', { 
      error, 
      email,
      whatsappNumber 
    });
  }
};

/**
 * Get client IP address (if available)
 */
const getClientIP = async (): Promise<string | null> => {
  try {
    // Try to get IP from a service (if needed)
    // For now, return null as IP capture should happen server-side
    return null;
  } catch {
    return null;
  }
};

