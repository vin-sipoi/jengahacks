/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

// File upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MAX_FILE_SIZE_MB = 5; // 5MB for display purposes

// Registration constants
export const REGISTRATION_LIMIT = 200; // Maximum number of participants
export const DEBOUNCE_DELAY_MS = 2000; // 2 seconds debounce delay for form inputs

// Time constants (in seconds)
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_MONTH = 2592000; // ~30 days
export const SECONDS_PER_YEAR = 31536000; // ~365 days

// UI constants
export const DEFAULT_QR_CODE_SIZE = 200; // Default QR code size in pixels
export const EXCERPT_MAX_LENGTH = 200; // Maximum length for blog post excerpts

// Monitoring thresholds (can be overridden by environment variables)
export const DEFAULT_MONITORING_RESPONSE_TIME_THRESHOLD_MS = 2000; // 2 seconds
export const DEFAULT_MONITORING_ERROR_RATE_THRESHOLD = 0.1; // 10%
export const DEFAULT_MONITORING_MEMORY_THRESHOLD_MB = 100; // 100MB
export const DEFAULT_MONITORING_API_ERROR_RATE_THRESHOLD = 0.05; // 5%



