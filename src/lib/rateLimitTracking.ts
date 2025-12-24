/**
 * Rate limit violation tracking utilities
 * Provides functions to track and query rate limit violations
 */

import { logger } from "./logger";
import { monitor } from "./monitoring";
import { trackEvent } from "./analytics";
import { callRpc } from "./supabaseRpc";

export interface RateLimitViolation {
  id: string;
  violation_type: "email" | "ip" | "client";
  identifier: string;
  attempt_count: number;
  limit_threshold: number;
  retry_after_seconds: number | null;
  user_agent: string | null;
  request_path: string;
  created_at: string;
}

export interface ViolationStats {
  violation_type: string;
  total_count: number;
  unique_identifiers: number;
  recent_violations: number;
}

export interface TopViolator {
  violation_type: string;
  identifier: string;
  violation_count: number;
  first_violation: string;
  last_violation: string;
}

/**
 * Track a client-side rate limit violation
 */
export const trackClientRateLimitViolation = (
  identifier: string,
  attemptCount: number,
  retryAfter?: number
): void => {
  try {
    // Track in monitoring system
    monitor.trackMetric("rate_limit_violation", 1, {
      type: "client",
      identifier: identifier.substring(0, 50), // Limit length
      attempt_count: String(attemptCount),
    });

    // Track in analytics
    trackEvent("rate_limit_violation", {
      violation_type: "client",
      attempt_count: attemptCount,
      retry_after: retryAfter,
    });

    // Log for debugging
    logger.warn("Rate limit violation (client-side)", {
      identifier: identifier.substring(0, 50),
      attempt_count: attemptCount,
      retry_after: retryAfter,
    });
  } catch (error) {
    // Don't break the application if tracking fails
    console.error("Failed to track rate limit violation", error);
  }
};

/**
 * Get violation statistics
 */
export async function getViolationStats(
  hours: number = 24
): Promise<ViolationStats[]> {
  try {
    const { data, error } = await callRpc<ViolationStats[]>(
      "get_rate_limit_violation_stats",
      { p_hours: hours }
    );

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error(
      "Failed to get violation stats",
      error instanceof Error ? error : new Error(String(error)),
      { hours }
    );
    return [];
  }
}

/**
 * Get top violators
 */
export async function getTopViolators(
  limit: number = 10,
  hours: number = 24
): Promise<TopViolator[]> {
  try {
    const { data, error } = await callRpc<TopViolator[]>(
      "get_top_rate_limit_violators",
      { p_limit: limit, p_hours: hours }
    );

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error(
      "Failed to get top violators",
      error instanceof Error ? error : new Error(String(error)),
      { limit, hours }
    );
    return [];
  }
}

/**
 * Format violation type for display
 */
export const formatViolationType = (type: string): string => {
  switch (type) {
    case "email":
      return "Email";
    case "ip":
      return "IP Address";
    case "client":
      return "Client-Side";
    default:
      return type;
  }
};

/**
 * Format identifier for display (mask sensitive data)
 */
export const formatIdentifier = (identifier: string, type: string): string => {
  if (type === "email") {
    // Show first 3 chars and domain
    const [local, domain] = identifier.split("@");
    if (local && domain) {
      return `${local.substring(0, 3)}***@${domain}`;
    }
    return identifier;
  }

  if (type === "ip") {
    // Mask last octet for IPv4
    const parts = identifier.split(".");
    if (parts.length === 4) {
      return `${parts.slice(0, 3).join(".")}.***`;
    }
    // Mask last segment for IPv6
    const segments = identifier.split(":");
    if (segments.length > 1) {
      return `${segments.slice(0, -1).join(":")}:***`;
    }
    return identifier;
  }

  return identifier;
};

