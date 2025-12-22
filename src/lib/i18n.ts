/**
 * Internationalization (i18n) utilities for date and number formatting
 * Defaults to Kenya/East Africa locale (en-KE) but supports browser detection
 */

import { getStoredLocale } from "./locale";
import { logger } from "./logger";
import { SECONDS_PER_MINUTE, SECONDS_PER_HOUR, SECONDS_PER_DAY, SECONDS_PER_MONTH, SECONDS_PER_YEAR } from "./constants";

// Default locale for JengaHacks (Kenya/East Africa)
const DEFAULT_LOCALE = "en-UK";
const DEFAULT_TIMEZONE = "Africa/Nairobi";

// Current locale state (can be updated via setLocale)
let currentLocale: string | null = null;

/**
 * Get the current locale
 * Priority: Stored preference > Environment variable > Browser locale > Default (en-KE)
 */
export const getLocale = (): string => {
  // Use stored preference first (if set via setLocale)
  if (currentLocale) {
    return currentLocale;
  }

  // Check localStorage for stored preference
  try {
    const stored = getStoredLocale();
    if (stored && stored !== DEFAULT_LOCALE) {
      return stored;
    }
  } catch (error) {
    // Ignore errors in test environment
  }

  // Allow override via environment variable
  const envLocale = import.meta.env.VITE_LOCALE;
  if (envLocale) {
    return envLocale;
  }

  // In test environment, default to en-KE to avoid browser locale issues
  if (import.meta.env.MODE === "test" || typeof navigator === "undefined") {
    return DEFAULT_LOCALE;
  }

  // Try to detect from browser
  if (navigator.language) {
    // Use browser locale if it's English-based (en-*)
    if (navigator.language.startsWith("en")) {
      return navigator.language;
    }
  }

  // Default to Kenya locale
  return DEFAULT_LOCALE;
};

/**
 * Set the current locale (updates state and storage)
 */
export const setLocale = (locale: string): void => {
  currentLocale = locale;
  // Also update storage for persistence
  if (typeof window !== "undefined") {
    // Use static import for setStoredLocale to persist locale preference
    import("./locale").then(({ setStoredLocale }) => {
      // Cast locale to SupportedLocale since this function expects it
      setStoredLocale(locale as import("./locale").SupportedLocale);
    });
  }
};

/**
 * Get the current timezone
 */
export const getTimezone = (): string => {
  return import.meta.env.VITE_TIMEZONE || DEFAULT_TIMEZONE;
};

/**
 * Format date for display (long format)
 * Example: "December 15, 2025"
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const locale = getLocale();

  try {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    // Fallback to default locale if user's locale is invalid
    logger.warn("Invalid locale, falling back to default", { error: error instanceof Error ? error.message : String(error), locale });
    return date.toLocaleDateString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

/**
 * Format date for short display
 * Example: "Dec 15, 2025"
 */
export const formatDateShort = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const locale = getLocale();

  try {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    logger.warn("Invalid locale, falling back to default", { error: error instanceof Error ? error.message : String(error), locale });
    return date.toLocaleDateString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
};

/**
 * Format date and time for display
 * Example: "December 15, 2025 at 10:30 AM"
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const locale = getLocale();

  try {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.warn("Invalid locale, falling back to default:", error);
    return date.toLocaleString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
};

/**
 * Format date and time for short display
 * Example: "Dec 15, 2025, 10:30 AM"
 */
export const formatDateTimeShort = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const locale = getLocale();

  try {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.warn("Invalid locale, falling back to default:", error);
    return date.toLocaleString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  const locale = getLocale();

  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== "undefined" && Intl.RelativeTimeFormat) {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

      const absDiff = Math.abs(diffInSeconds);

      if (absDiff < SECONDS_PER_MINUTE) {
        return rtf.format(diffInSeconds, "second");
      } else if (absDiff < SECONDS_PER_HOUR) {
        return rtf.format(Math.floor(diffInSeconds / SECONDS_PER_MINUTE), "minute");
      } else if (absDiff < 86400) {
        return rtf.format(Math.floor(diffInSeconds / 3600), "hour");
      } else if (absDiff < 2592000) {
        return rtf.format(Math.floor(diffInSeconds / 86400), "day");
      } else if (absDiff < 31536000) {
        return rtf.format(Math.floor(diffInSeconds / 2592000), "month");
      } else {
        return rtf.format(Math.floor(diffInSeconds / 31536000), "year");
      }
    } catch (error) {
      logger.warn("Error formatting relative time", { error: error instanceof Error ? error.message : String(error), date: date.toISOString() });
    }
  }

  // Fallback to simple format
  const absDiff = Math.abs(diffInSeconds);
  if (absDiff < 60) {
    return diffInSeconds < 0 ? "just now" : "in a moment";
  } else if (absDiff < 3600) {
    const minutes = Math.floor(absDiff / 60);
    return diffInSeconds < 0 ? `${minutes} minutes ago` : `in ${minutes} minutes`;
  } else if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    return diffInSeconds < 0 ? `${hours} hours ago` : `in ${hours} hours`;
  } else {
    const days = Math.floor(absDiff / 86400);
    return diffInSeconds < 0 ? `${days} days ago` : `in ${days} days`;
  }
};

/**
 * Format number according to locale
 */
export const formatNumber = (value: number): string => {
  const locale = getLocale();

  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch (error) {
    logger.warn("Error formatting number", { error: error instanceof Error ? error.message : String(error), value, locale });
    return value.toString();
  }
};

/**
 * Format currency according to locale
 */
export const formatCurrency = (value: number, currency: string = "KES"): string => {
  const locale = getLocale();

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  } catch (error) {
    logger.warn("Error formatting currency", { error: error instanceof Error ? error.message : String(error), value, currency, locale });
    return `${currency} ${value.toFixed(2)}`;
  }
};

