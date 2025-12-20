import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  recordSubmission,
  formatRetryAfter,
  clearRateLimit,
} from "./rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    clearRateLimit();
  });

  describe("checkRateLimit", () => {
    it("should allow first submission", () => {
      const result = checkRateLimit();
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should allow multiple submissions within limit", () => {
      checkRateLimit(); // First
      const result1 = checkRateLimit(); // Second
      expect(result1.allowed).toBe(true);

      const result2 = checkRateLimit(); // Third
      expect(result2.allowed).toBe(true);
    });

    it("should block after exceeding limit", () => {
      // Make 3 submissions
      checkRateLimit();
      checkRateLimit();
      checkRateLimit();

      // Fourth should be blocked
      const result = checkRateLimit();
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should reset after window expires", () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let mockTime = originalNow();

      vi.spyOn(Date, "now").mockImplementation(() => mockTime);

      // Make 3 submissions
      checkRateLimit();
      checkRateLimit();
      checkRateLimit();

      // Should be blocked
      let result = checkRateLimit();
      expect(result.allowed).toBe(false);

      // Advance time by 1 hour + 1 second
      mockTime += 60 * 60 * 1000 + 1000;
      vi.spyOn(Date, "now").mockImplementation(() => mockTime);

      // Should be allowed again
      result = checkRateLimit();
      expect(result.allowed).toBe(true);

      // Restore original Date.now
      vi.spyOn(Date, "now").mockImplementation(originalNow);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Should fail open (allow submission)
      const result = checkRateLimit();
      expect(result.allowed).toBe(true);

      // Restore
      vi.spyOn(localStorage, "getItem").mockImplementation(originalGetItem);
    });
  });

  describe("formatRetryAfter", () => {
    it("should format seconds correctly", () => {
      expect(formatRetryAfter(30)).toBe("30 seconds");
      expect(formatRetryAfter(1)).toBe("1 second");
    });

    it("should format minutes correctly", () => {
      expect(formatRetryAfter(60)).toBe("1 minute");
      expect(formatRetryAfter(120)).toBe("2 minutes");
    });

    it("should format minutes and seconds correctly", () => {
      expect(formatRetryAfter(90)).toBe("1 minute and 30 seconds");
      expect(formatRetryAfter(150)).toBe("2 minutes and 30 seconds");
    });
  });

  describe("clearRateLimit", () => {
    it("should clear rate limit data", () => {
      checkRateLimit();
      expect(localStorage.getItem("jengahacks_rate_limit")).toBeTruthy();

      clearRateLimit();
      expect(localStorage.getItem("jengahacks_rate_limit")).toBeNull();
    });
  });
});

