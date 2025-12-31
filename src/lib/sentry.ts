import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and monitoring
 * Should be called before rendering the React app
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || "development";
  const enabled = import.meta.env.VITE_SENTRY_ENABLED === "true";

  // Only initialize if DSN is provided
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn("Sentry DSN not configured. Error tracking disabled.");
    }
    return;
  }

  // Only initialize if explicitly enabled (defaults to false for privacy)
  if (!enabled) {
    if (import.meta.env.DEV) {
      console.info("Sentry is disabled. Set VITE_SENTRY_ENABLED=true to enable.");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session replay (optional, can be enabled for debugging)
    replaysSessionSampleRate: environment === "production" ? 0.0 : 0.1, // Disabled in prod by default
    replaysOnErrorSampleRate: environment === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Setting this option to true will send default PII data to Sentry
    // For example, automatic IP address collection on events
    sendDefaultPii: import.meta.env.VITE_SENTRY_SEND_PII === "true",
    
    // Release tracking
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    
    // Before sending event, you can modify it or drop it
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (environment === "development" && import.meta.env.VITE_SENTRY_ENABLE_IN_DEV !== "true") {
        return null;
      }
      
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Ignore network errors (common and usually not actionable)
        if (error instanceof TypeError && errorMessage.includes("fetch")) {
          return null;
        }
        
        // Ignore ResizeObserver errors (common browser quirk)
        if (error instanceof Error && errorMessage.includes("ResizeObserver")) {
          return null;
        }
        
        // Ignore reCAPTCHA cross-origin frame errors (common in development with HTTP localhost)
        if (errorMessage.includes("Blocked a frame") && 
            (errorMessage.includes("google.com") || errorMessage.includes("recaptcha"))) {
          return null;
        }
        
        // Ignore protocol mismatch errors (HTTP localhost accessing HTTPS resources)
        if (errorMessage.includes("protocols must match") || 
            errorMessage.includes("Protocols must match")) {
          return null;
        }
      }
      
      // Also filter by error message in the event itself
      if (event.message) {
        const message = typeof event.message === 'string' ? event.message : event.message.formatted || '';
        if (message.includes("Blocked a frame") && 
            (message.includes("google.com") || message.includes("recaptcha"))) {
          return null;
        }
        if (message.includes("protocols must match") || 
            message.includes("Protocols must match")) {
          return null;
        }
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Mask sensitive text by default
        blockAllMedia: true, // Block media for privacy
      }),
    ],
  });
};

/**
 * Capture an exception manually
 */
export const captureException = Sentry.captureException;

/**
 * Capture a message manually
 */
export const captureMessage = Sentry.captureMessage;

/**
 * Set user context for error tracking
 */
export const setUser = Sentry.setUser;

/**
 * Set additional context/tags
 */
export const setTag = Sentry.setTag;

/**
 * Set additional context
 */
export const setContext = Sentry.setContext;
