/**
 * Common error handling utilities
 * Provides standardized error handling patterns across the application
 */

import { logger } from "./logger";

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

/**
 * Safely execute an async function and return a Result
 * 
 * @example
 * ```typescript
 * const result = await safeAsync(() => someAsyncOperation());
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   logger.error('Operation failed', result.error);
 * }
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Async operation failed", err, context);
    return { success: false, error: err };
  }
}

/**
 * Safely execute a synchronous function and return a Result
 */
export function safeSync<T>(
  fn: () => T,
  context?: Record<string, unknown>
): Result<T, Error> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Sync operation failed", err, context);
    return { success: false, error: err };
  }
}

/**
 * Handle errors with consistent logging and optional user feedback
 */
export function handleError(
  error: unknown,
  context?: {
    message?: string;
    userMessage?: string;
    logContext?: Record<string, unknown>;
    silent?: boolean;
  }
): Error {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = context?.message || "An error occurred";
  
  if (!context?.silent) {
    logger.error(message, err, context?.logContext);
  }
  
  return err;
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: {
    errorMessage?: string;
    logContext?: Record<string, unknown>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, {
        message: context?.errorMessage || "Function execution failed",
        logContext: context?.logContext,
      });
      throw error;
    }
  }) as T;
}

/**
 * Convert an error to a user-friendly message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error details to users
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    // Generic fallback
    return "An unexpected error occurred. Please try again later.";
  }
  return "An unexpected error occurred. Please try again later.";
}

