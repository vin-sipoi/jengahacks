import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import polyfills for browser compatibility
import "./lib/polyfills.ts";

// Initialize critical systems synchronously
import { initSentry } from "./lib/sentry";
initSentry();

// Suppress known non-critical errors in development (e.g., reCAPTCHA cross-origin frame errors, source map errors)
if (import.meta.env.DEV) {
  // Helper function to check if error is related to reCAPTCHA cross-origin issues
  const isRecaptchaError = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return (
      (lowerMessage.includes('blocked a frame') || 
       lowerMessage.includes('blocked frame')) &&
      (lowerMessage.includes('google.com') || 
       lowerMessage.includes('googleapis.com') ||
       lowerMessage.includes('recaptcha') ||
       lowerMessage.includes('gstatic.com'))
    ) || (
      (lowerMessage.includes('protocol') && lowerMessage.includes('must match')) ||
      (lowerMessage.includes('protocols must match')) ||
      (lowerMessage.includes('protocol mismatch'))
    ) || (
      lowerMessage.includes('cross-origin') &&
      (lowerMessage.includes('google') || lowerMessage.includes('recaptcha'))
    );
  };

  // Helper function to check if error is related to source maps
  const isSourceMapError = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('.js.map') ||
      lowerMessage.includes('failed to load resource') ||
      lowerMessage.includes('could not connect to the server') ||
      lowerMessage.includes('the network connection was lost') ||
      lowerMessage.includes('source map')
    );
  };

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.join(' ');
    // Suppress reCAPTCHA cross-origin frame errors in development
    if (isRecaptchaError(message)) {
      return; // Suppress this error
    }
    // Suppress source map loading errors (non-critical, just for debugging)
    if (isSourceMapError(message)) {
      return; // Suppress source map errors
    }
    // Call original console.error for other errors
    originalError.apply(console, args);
  };

  // Suppress network errors for source maps
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = args.join(' ');
    // Suppress reCAPTCHA warnings
    if (isRecaptchaError(message)) {
      return; // Suppress this warning
    }
    // Suppress source map warnings
    if (isSourceMapError(message)) {
      return; // Suppress source map warnings
    }
    // Call original console.warn for other warnings
    originalWarn.apply(console, args);
  };

  // Suppress unhandled errors and promise rejections
  const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
    const errorMessage = event instanceof ErrorEvent 
      ? (event.message || event.error?.message || '')
      : (event.reason?.message || String(event.reason) || '');
    
    if (isRecaptchaError(errorMessage)) {
      event.preventDefault();
      if (event instanceof ErrorEvent) {
        event.stopPropagation();
      }
      return false;
    }
    if (isSourceMapError(errorMessage)) {
      event.preventDefault();
      if (event instanceof ErrorEvent) {
        event.stopPropagation();
      }
      return false;
    }
  };

  // Listen for error events (capture phase to catch early)
  window.addEventListener('error', handleError, true);
  
  // Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', handleError, true);

  // Also suppress SecurityError exceptions for cross-origin issues
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = String(message || error?.message || '');
    if (isRecaptchaError(errorMessage) || isSourceMapError(errorMessage)) {
      return true; // Suppress the error
    }
    // Call original handler if it exists
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
}

// Defer non-critical initialization until after first render
const initializeNonCritical = () => {
  // Initialize logger (deferred)
  import("./lib/logger").then(({ logger }) => {
    logger.info('Application starting', {
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
    });
  });

  // Initialize monitoring (deferred)
  import('./lib/monitoring').then(({ monitor }) => {
    monitor.trackMetric('app_start', 1, { environment: import.meta.env.MODE });
  });
};

// Initialize after first paint
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    initializeNonCritical();
  } else {
    window.addEventListener('load', initializeNonCritical, { once: true });
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
