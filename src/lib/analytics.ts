/**
 * Google Analytics 4 (GA4) integration
 * Provides event tracking and page view analytics
 */

// Google Analytics event parameters type
type GAEventParams = Record<string, string | number | boolean | undefined>;

// Google Analytics config type
type GAConfig = {
  page_path?: string;
  page_title?: string;
  send_page_view?: boolean;
  [key: string]: string | number | boolean | undefined;
};

// Google Analytics dataLayer entry type
type GADataLayerEntry =
  | [string, string | Date, GAConfig | GAEventParams | undefined]
  | [string, string | Date]
  | [string];

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "set" | "js",
      targetId: string | Date,
      config?: GAConfig | GAEventParams
    ) => void;
    dataLayer?: GADataLayerEntry[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const GA_ENABLED = GA_MEASUREMENT_ID && import.meta.env.VITE_GA_ENABLED !== "false";

/**
 * Initialize Google Analytics
 */
export const initGA = (): void => {
  if (!GA_ENABLED || !GA_MEASUREMENT_ID) {
    return;
  }

  // Create dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || [];

  // Define gtag function
  window.gtag = function gtag(
    command: "config" | "event" | "set" | "js",
    targetId: string | Date,
    config?: GAConfig | GAEventParams
  ) {
    const args: [string, string | Date, GAConfig | GAEventParams | undefined] = [command, targetId, config];
    window.dataLayer?.push(args);
  };

  // Set initial timestamp
  window.gtag("js", new Date());

  // Configure GA
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    page_title: document.title,
  });

  // Load GA script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!GA_ENABLED || !window.gtag) {
    return;
  }

  window.gtag("config", GA_MEASUREMENT_ID!, {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: GAEventParams
): void => {
  if (!GA_ENABLED || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, {
    ...eventParams,
  });
};

/**
 * Track form submission
 */
export const trackFormSubmission = (formName: string, success: boolean = true): void => {
  trackEvent("form_submit", {
    form_name: formName,
    success,
  });
};

/**
 * Track registration
 */
export const trackRegistration = (success: boolean, error?: string): void => {
  trackEvent("registration", {
    event_category: "engagement",
    success,
    ...(error && { error_message: error }),
  });
};

/**
 * Track when the registration section is viewed
 */
export const trackRegistrationView = (): void => {
  trackEvent("registration_view", {
    event_category: "engagement",
  });
};

/**
 * Track when a user starts filling out the registration form
 */
export const trackRegistrationStart = (): void => {
  trackEvent("registration_start", {
    event_category: "engagement",
  });
};

/**
 * Track button click
 */
export const trackButtonClick = (buttonName: string, location?: string): void => {
  trackEvent("button_click", {
    button_name: buttonName,
    location: location || window.location.pathname,
  });
};

/**
 * Track external link click
 */
export const trackExternalLink = (url: string, linkText?: string): void => {
  trackEvent("external_link_click", {
    link_url: url,
    link_text: linkText,
  });
};

/**
 * Track download
 */
export const trackDownload = (fileName: string, fileType?: string): void => {
  trackEvent("file_download", {
    file_name: fileName,
    file_type: fileType,
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount?: number): void => {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Track social share
 */
export const trackSocialShare = (platform: string, contentType?: string, contentId?: string): void => {
  trackEvent("share", {
    method: platform,
    content_type: contentType,
    content_id: contentId,
  });
};

/**
 * Check if GA is enabled
 */
export const isGAEnabled = (): boolean => {
  return GA_ENABLED && !!GA_MEASUREMENT_ID;
};

