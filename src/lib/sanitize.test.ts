import { describe, it, expect, beforeEach, vi } from "vitest";
import { sanitizeHtml, sanitizeForRender } from "./sanitize";

// Mock DOMPurify for testing
vi.mock("dompurify", () => {
  const mockSanitize = (html: string) => {
    // Basic mock implementation - remove script tags and dangerous attributes
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:/gi, "");
  };

  return {
    default: {
      sanitize: mockSanitize,
    },
  };
});

describe("sanitize utilities", () => {
  describe("sanitizeHtml", () => {
    it("should return empty string for non-string input", () => {
      expect(sanitizeHtml(null as unknown as string)).toBe("");
      expect(sanitizeHtml(undefined as unknown as string)).toBe("");
      expect(sanitizeHtml(123 as unknown as string)).toBe("");
    });

    it("should sanitize XSS attempts", () => {
      const malicious = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain("<script>");
      expect(result).toContain("Safe content");
    });

    it("should remove dangerous event handlers", () => {
      const malicious = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain("onerror");
    });

    it("should remove javascript: protocol", () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain("javascript:");
    });

    it("should preserve safe HTML tags", () => {
      const safe = "<p>Safe content</p><strong>Bold</strong><em>Italic</em>";
      const result = sanitizeHtml(safe);
      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
    });

    it("should handle empty strings", () => {
      expect(sanitizeHtml("")).toBe("");
    });

    it("should accept custom allowed tags", () => {
      const html = "<div><span>Content</span></div>";
      const result = sanitizeHtml(html, {
        allowedTags: ["div"],
      });
      // Mock implementation will preserve div but remove span
      expect(result).toBeDefined();
    });

    it("should accept custom allowed attributes", () => {
      const html = '<a href="https://example.com" title="Link">Link</a>';
      const result = sanitizeHtml(html, {
        allowedAttributes: { a: ["href", "title"] },
      });
      expect(result).toBeDefined();
    });
  });

  describe("sanitizeForRender", () => {
    it("should return object with __html property", () => {
      const result = sanitizeForRender("<p>Test</p>");
      expect(result).toHaveProperty("__html");
      expect(typeof result.__html).toBe("string");
    });

    it("should sanitize HTML content", () => {
      const malicious = '<script>alert("xss")</script><p>Safe</p>';
      const result = sanitizeForRender(malicious);
      expect(result.__html).not.toContain("<script>");
      expect(result.__html).toContain("Safe");
    });

    it("should handle empty strings", () => {
      const result = sanitizeForRender("");
      expect(result.__html).toBe("");
    });

    it("should be usable with dangerouslySetInnerHTML", () => {
      const html = "<p>Test content</p>";
      const sanitized = sanitizeForRender(html);
      // This should be safe to use with dangerouslySetInnerHTML
      expect(sanitized.__html).toBeDefined();
    });
  });
});

