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
    // Only log errors in development to reduce console noise
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.error("Failed to track rate limit violation", error);
    }
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

// ============================================
// REAL-TIME ALERTS
// ============================================

export interface ViolationAlert {
  id: string;
  alert_type: "high_rate" | "repeated_violator" | "suspicious_pattern" | "auto_blocked";
  severity: "low" | "medium" | "high" | "critical";
  violation_type: string;
  identifier: string;
  violation_count: number;
  message: string;
  context?: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

/**
 * Get violation alerts
 */
export async function getViolationAlerts(
  resolved: boolean | null = null,
  severity?: string,
  limit: number = 50
): Promise<ViolationAlert[]> {
  try {
    // Note: This would require a new RPC function or direct query
    // For now, we'll use the monitoring system alerts
    const alerts = monitor.getAlerts(!resolved);
    
    // Filter and map to ViolationAlert format
    return alerts
      .filter(alert => {
        if (severity && alert.severity !== severity) return false;
        // Filter for rate limit related alerts
        return alert.id.includes('rate_limit') || alert.id.includes('violation');
      })
      .map(alert => ({
        id: alert.id,
        alert_type: alert.id.includes('high_rate') ? 'high_rate' as const :
                    alert.id.includes('repeated') ? 'repeated_violator' as const :
                    alert.id.includes('pattern') ? 'suspicious_pattern' as const :
                    'auto_blocked' as const,
        severity: alert.severity,
        violation_type: (alert.context?.violation_type as string) || 'unknown',
        identifier: (alert.context?.identifier as string) || 'unknown',
        violation_count: (alert.context?.violation_count as number) || 0,
        message: alert.message,
        context: alert.context as Record<string, unknown>,
        is_resolved: false,
        created_at: alert.timestamp,
      }))
      .slice(0, limit);
  } catch (error) {
    logger.error(
      "Failed to get violation alerts",
      error instanceof Error ? error : new Error(String(error)),
      { resolved, severity }
    );
    return [];
  }
}

/**
 * Check for high violation rates and create alerts
 */
export async function checkHighViolationRate(
  threshold: number = 10,
  timeWindowMinutes: number = 15
): Promise<void> {
  try {
    await callRpc("check_high_violation_rate", {
      p_threshold: threshold,
      p_time_window_minutes: timeWindowMinutes,
    });
    
    // Also create monitoring alert
    monitor.alert(
      `high_violation_rate_${Date.now()}`,
      "high",
      `High violation rate detected: threshold ${threshold} violations in ${timeWindowMinutes} minutes`,
      { threshold, timeWindowMinutes }
    );
  } catch (error) {
    logger.error(
      "Failed to check high violation rate",
      error instanceof Error ? error : new Error(String(error)),
      { threshold, timeWindowMinutes }
    );
  }
}

/**
 * Check for repeated violators and create alerts
 */
export async function checkRepeatedViolators(
  threshold: number = 3,
  timeWindowHours: number = 24
): Promise<void> {
  try {
    await callRpc("check_repeated_violators", {
      p_threshold: threshold,
      p_time_window_hours: timeWindowHours,
    });
  } catch (error) {
    logger.error(
      "Failed to check repeated violators",
      error instanceof Error ? error : new Error(String(error)),
      { threshold, timeWindowHours }
    );
  }
}

// ============================================
// AUTOMATED BLOCKING
// ============================================

export interface BlockedIdentifier {
  id: string;
  identifier: string;
  violation_type: string;
  violation_count: number;
  blocked_at: string;
  blocked_until?: string;
  reason: string;
  blocked_by?: string;
  is_active: boolean;
}

/**
 * Check if an identifier is blocked
 */
export async function isIdentifierBlocked(
  identifier: string,
  violationType: "email" | "ip" | "client"
): Promise<boolean> {
  try {
    const { data, error } = await callRpc<boolean>("is_identifier_blocked", {
      p_identifier: identifier,
      p_violation_type: violationType,
    });

    if (error) {
      throw error;
    }

    return data || false;
  } catch (error) {
    logger.error(
      "Failed to check if identifier is blocked",
      error instanceof Error ? error : new Error(String(error)),
      { identifier, violationType }
    );
    return false;
  }
}

/**
 * Block an identifier
 */
export async function blockIdentifier(
  identifier: string,
  violationType: "email" | "ip" | "client",
  violationCount: number,
  reason: string,
  blockedBy: string = "system",
  blockedUntil?: Date
): Promise<string | null> {
  try {
    const { data, error } = await callRpc<string>("block_identifier", {
      p_identifier: identifier,
      p_violation_type: violationType,
      p_violation_count: violationCount,
      p_reason: reason,
      p_blocked_by: blockedBy,
      p_blocked_until: blockedUntil?.toISOString() || null,
    });

    if (error) {
      throw error;
    }

    // Create monitoring alert
    monitor.alert(
      `identifier_blocked_${identifier}_${Date.now()}`,
      "high",
      `Identifier blocked: ${identifier} (${violationType})`,
      { identifier, violationType, violationCount, reason }
    );

    return data || null;
  } catch (error) {
    logger.error(
      "Failed to block identifier",
      error instanceof Error ? error : new Error(String(error)),
      { identifier, violationType, violationCount, reason }
    );
    return null;
  }
}

/**
 * Unblock an identifier
 */
export async function unblockIdentifier(
  identifier: string,
  violationType: "email" | "ip" | "client",
  unblockedBy: string = "system"
): Promise<boolean> {
  try {
    const { data, error } = await callRpc<boolean>("unblock_identifier", {
      p_identifier: identifier,
      p_violation_type: violationType,
      p_unblocked_by: unblockedBy,
    });

    if (error) {
      throw error;
    }

    return data || false;
  } catch (error) {
    logger.error(
      "Failed to unblock identifier",
      error instanceof Error ? error : new Error(String(error)),
      { identifier, violationType }
    );
    return false;
  }
}

/**
 * Automatically block persistent violators
 */
export async function autoBlockPersistentViolators(
  violationThreshold: number = 5,
  timeWindowHours: number = 24
): Promise<Array<{ identifier: string; violation_type: string; violation_count: number; blocked_id: string }>> {
  try {
    const { data, error } = await callRpc<
      Array<{ identifier: string; violation_type: string; violation_count: number; blocked_id: string }>
    >("auto_block_persistent_violators", {
      p_violation_threshold: violationThreshold,
      p_time_window_hours: timeWindowHours,
    });

    if (error) {
      throw error;
    }

    // Create monitoring alerts for each blocked identifier
    if (data && data.length > 0) {
      data.forEach((blocked) => {
        monitor.alert(
          `auto_blocked_${blocked.identifier}_${Date.now()}`,
          "high",
          `Auto-blocked persistent violator: ${blocked.identifier} (${blocked.violation_count} violations)`,
          { ...blocked, threshold: violationThreshold, timeWindowHours }
        );
      });
    }

    return data || [];
  } catch (error) {
    logger.error(
      "Failed to auto-block persistent violators",
      error instanceof Error ? error : new Error(String(error)),
      { violationThreshold, timeWindowHours }
    );
    return [];
  }
}

// ============================================
// PATTERN ANALYSIS
// ============================================

export interface ViolationPattern {
  id: string;
  pattern_type: "burst" | "distributed" | "repeated" | "suspicious_ua" | "time_based";
  pattern_description: string;
  identifiers: string[];
  violation_count: number;
  confidence_score: number;
  detected_at: string;
}

/**
 * Detect violation patterns
 */
export async function detectViolationPatterns(
  timeWindowHours: number = 24
): Promise<ViolationPattern[]> {
  try {
    const { data, error } = await callRpc<ViolationPattern[]>("detect_violation_patterns", {
      p_time_window_hours: timeWindowHours,
    });

    if (error) {
      throw error;
    }

    // Create alerts for high-confidence patterns
    if (data) {
      data
        .filter((pattern) => pattern.confidence_score >= 0.8)
        .forEach((pattern) => {
          monitor.alert(
            `violation_pattern_${pattern.id}`,
            pattern.confidence_score >= 0.9 ? "high" : "medium",
            `Violation pattern detected: ${pattern.pattern_description}`,
            { pattern }
          );
        });
    }

    return data || [];
  } catch (error) {
    logger.error(
      "Failed to detect violation patterns",
      error instanceof Error ? error : new Error(String(error)),
      { timeWindowHours }
    );
    return [];
  }
}

/**
 * Get violation patterns
 */
export async function getViolationPatterns(
  hours: number = 24,
  minConfidence: number = 0.5
): Promise<ViolationPattern[]> {
  try {
    const { data, error } = await callRpc<ViolationPattern[]>("get_violation_patterns", {
      p_hours: hours,
      p_min_confidence: minConfidence,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error(
      "Failed to get violation patterns",
      error instanceof Error ? error : new Error(String(error)),
      { hours, minConfidence }
    );
    return [];
  }
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

/**
 * Export violations to CSV format
 */
export async function exportViolationsCSV(
  startDate?: Date,
  endDate?: Date,
  violationType?: string,
  limit: number = 10000
): Promise<string> {
  try {
    const { data, error } = await callRpc<
      Array<{
        id: string;
        violation_type: string;
        identifier: string;
        attempt_count: number;
        limit_threshold: number;
        retry_after_seconds: number | null;
        user_agent: string | null;
        request_path: string;
        created_at: string;
      }>
    >("get_violations_for_export", {
      p_start_date: startDate?.toISOString() || null,
      p_end_date: endDate?.toISOString() || null,
      p_violation_type: violationType || null,
      p_limit: limit,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return "No violations found";
    }

    // Convert to CSV
    const headers = [
      "ID",
      "Violation Type",
      "Identifier",
      "Attempt Count",
      "Limit Threshold",
      "Retry After (seconds)",
      "User Agent",
      "Request Path",
      "Created At",
    ];

    const rows = data.map((violation) => [
      violation.id,
      violation.violation_type,
      violation.identifier,
      violation.attempt_count.toString(),
      violation.limit_threshold.toString(),
      violation.retry_after_seconds?.toString() || "",
      violation.user_agent || "",
      violation.request_path,
      violation.created_at,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return csvContent;
  } catch (error) {
    logger.error(
      "Failed to export violations CSV",
      error instanceof Error ? error : new Error(String(error)),
      { startDate, endDate, violationType, limit }
    );
    throw error;
  }
}

/**
 * Export violations to JSON format
 */
export async function exportViolationsJSON(
  startDate?: Date,
  endDate?: Date,
  violationType?: string,
  limit: number = 10000
): Promise<string> {
  try {
    const { data, error } = await callRpc<
      Array<{
        id: string;
        violation_type: string;
        identifier: string;
        attempt_count: number;
        limit_threshold: number;
        retry_after_seconds: number | null;
        user_agent: string | null;
        request_path: string;
        created_at: string;
      }>
    >("get_violations_for_export", {
      p_start_date: startDate?.toISOString() || null,
      p_end_date: endDate?.toISOString() || null,
      p_violation_type: violationType || null,
      p_limit: limit,
    });

    if (error) {
      throw error;
    }

    return JSON.stringify(data || [], null, 2);
  } catch (error) {
    logger.error(
      "Failed to export violations JSON",
      error instanceof Error ? error : new Error(String(error)),
      { startDate, endDate, violationType, limit }
    );
    throw error;
  }
}

/**
 * Export violation summary report
 */
export async function exportViolationSummary(
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await callRpc<Record<string, unknown>>(
      "get_violation_summary_export",
      {
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      }
    );

    if (error) {
      throw error;
    }

    return data || {};
  } catch (error) {
    logger.error(
      "Failed to export violation summary",
      error instanceof Error ? error : new Error(String(error)),
      { startDate, endDate }
    );
    throw error;
  }
}

/**
 * Download violations as CSV file
 */
export function downloadViolationsCSV(
  csvContent: string,
  filename: string = `violations_${new Date().toISOString().split("T")[0]}.csv`
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download violations as JSON file
 */
export function downloadViolationsJSON(
  jsonContent: string,
  filename: string = `violations_${new Date().toISOString().split("T")[0]}.json`
): void {
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

