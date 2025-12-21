/**
 * Client-side rate limiting utilities
 * Note: This provides UX improvements but should be complemented with server-side rate limiting
 */

const RATE_LIMIT_KEY = 'jengahacks_rate_limit';
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_SUBMISSIONS_PER_WINDOW = 3; // Max 3 submissions per hour

interface RateLimitData {
  attempts: number;
  windowStart: number;
}

/**
 * Check if user has exceeded rate limit
 * @returns Object with `allowed` boolean and `retryAfter` seconds if rate limited
 */
export const checkRateLimit = (): { allowed: boolean; retryAfter?: number } => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      // First submission, initialize
      const data: RateLimitData = {
        attempts: 1,
        windowStart: now,
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      return { allowed: true };
    }

    const data: RateLimitData = JSON.parse(stored);
    const timeSinceWindowStart = now - data.windowStart;

    // If window has expired, reset
    if (timeSinceWindowStart >= RATE_LIMIT_WINDOW) {
      const newData: RateLimitData = {
        attempts: 1,
        windowStart: now,
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newData));
      return { allowed: true };
    }

    // Check if limit exceeded
    if (data.attempts >= MAX_SUBMISSIONS_PER_WINDOW) {
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - timeSinceWindowStart) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment attempts
    data.attempts += 1;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    return { allowed: true };
  } catch (error) {
    // If localStorage fails, allow submission (fail open)
    // Server-side rate limiting will catch abuse
    console.warn('Rate limit check failed:', error);
    return { allowed: true };
  }
};

/**
 * Record a successful submission
 */
export const recordSubmission = (): void => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      const data: RateLimitData = JSON.parse(stored);
      // Keep the window start but increment attempts
      data.attempts += 1;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    }
  } catch (error) {
    // Silently fail - not critical
    console.warn('Failed to record submission:', error);
  }
};

/**
 * Format retry after time for display
 */
export const formatRetryAfter = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};

/**
 * Clear rate limit (useful for testing or manual reset)
 */
export const clearRateLimit = (): void => {
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch (error) {
    console.warn('Failed to clear rate limit:', error);
  }
};


