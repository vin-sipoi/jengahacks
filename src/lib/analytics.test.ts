import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock environment before importing
vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-XXXXXXXXXX");
vi.stubEnv("VITE_GA_ENABLED=true", undefined);

import {
  initGA,
  trackPageView,
  trackEvent,
  trackRegistration,
  trackButtonClick,
  trackExternalLink,
  trackDownload,
  trackSearch,
  trackSocialShare,
  isGAEnabled,
} from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
    // Clear window.gtag and dataLayer
    if (window.gtag) {
      delete window.gtag;
    }
    if (window.dataLayer) {
      delete window.dataLayer;
    }
    vi.clearAllMocks();
    // Ensure GA is enabled for tests
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-F92GY3J7W2");
    vi.stubEnv("VITE_GA_ENABLED", undefined);
  });

  describe("isGAEnabled", () => {
    it("should return true when GA_MEASUREMENT_ID is set", () => {
      expect(isGAEnabled()).toBe(true);
    });
  });

  describe("initGA", () => {
    it("should initialize GA when enabled", () => {
      initGA();
      expect(window.gtag).toBeDefined();
      expect(window.dataLayer).toBeDefined();
    });
  });

  describe("trackPageView", () => {
    it("should track page view when GA is enabled", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackPageView("/test", "Test Page");
      expect(mockGtag).toHaveBeenCalledWith("config", "G-XXXXXXXXXX", {
        page_path: "/test",
        page_title: "Test Page",
      });
    });
  });

  describe("trackEvent", () => {
    it("should track custom events", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackEvent("custom_event", { category: "test", value: 1 });
      expect(mockGtag).toHaveBeenCalledWith("event", "custom_event", {
        category: "test",
        value: 1,
      });
    });
  });

  describe("trackRegistration", () => {
    it("should track successful registration", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackRegistration(true);
      expect(mockGtag).toHaveBeenCalledWith("event", "registration", {
        event_category: "engagement",
        success: true,
      });
    });

    it("should track failed registration with error", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackRegistration(false, "Test error");
      expect(mockGtag).toHaveBeenCalledWith("event", "registration", {
        event_category: "engagement",
        success: false,
        error_message: "Test error",
      });
    });
  });

  describe("trackButtonClick", () => {
    it("should track button clicks", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackButtonClick("Test Button", "/test");
      expect(mockGtag).toHaveBeenCalledWith("event", "button_click", {
        button_name: "Test Button",
        location: "/test",
      });
    });
  });

  describe("trackExternalLink", () => {
    it("should track external link clicks", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackExternalLink("https://example.com", "Example Link");
      expect(mockGtag).toHaveBeenCalledWith("event", "external_link_click", {
        link_url: "https://example.com",
        link_text: "Example Link",
      });
    });
  });

  describe("trackDownload", () => {
    it("should track file downloads", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackDownload("test.pdf", "pdf");
      expect(mockGtag).toHaveBeenCalledWith("event", "file_download", {
        file_name: "test.pdf",
        file_type: "pdf",
      });
    });
  });

  describe("trackSearch", () => {
    it("should track searches", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackSearch("test query", 5);
      expect(mockGtag).toHaveBeenCalledWith("event", "search", {
        search_term: "test query",
        results_count: 5,
      });
    });
  });

  describe("trackSocialShare", () => {
    it("should track social shares", () => {
      const mockGtag = vi.fn();
      window.gtag = mockGtag;
      trackSocialShare("twitter", "event", "event-123");
      expect(mockGtag).toHaveBeenCalledWith("event", "share", {
        method: "twitter",
        content_type: "event",
        content_id: "event-123",
      });
    });
  });
});
