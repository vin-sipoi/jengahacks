import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import polyfills for browser compatibility
import "./lib/polyfills.ts";
// Initialize Sentry before rendering the app
import { initSentry } from "./lib/sentry";

// Initialize Sentry error tracking
initSentry();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
