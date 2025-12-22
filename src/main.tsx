import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import polyfills for browser compatibility
import "./lib/polyfills.ts";
// Initialize Sentry before rendering the app
import { initSentry } from "./lib/sentry";
// Initialize logger
import { logger } from "./lib/logger";

// Initialize Sentry error tracking
initSentry();

// Log application startup
logger.info('Application starting', {
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || 'unknown',
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
