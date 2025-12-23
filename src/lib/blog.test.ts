import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchBlogPosts,
  getPosts,
  formatBlogDate,
  formatBlogDateShort,
} from "./blog";

describe("blog utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPosts", () => {
    it("should return posts", () => {
      const posts = getPosts();
      expect(posts.length).toBeGreaterThan(0);
      expect(posts[0]).toHaveProperty("id");
      expect(posts[0]).toHaveProperty("title");
      expect(posts[0]).toHaveProperty("excerpt");
      expect(posts[0]).toHaveProperty("publishedAt");
    });

    it("should limit posts when limit is provided", () => {
      const posts = getPosts(2);
      expect(posts.length).toBe(2);
    });

    it("should return all posts when limit is not provided", () => {
      const posts = getPosts();
      expect(posts.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("formatBlogDate", () => {
    it("should format date correctly", () => {
      const dateString = "2025-12-15T10:00:00Z";
      const formatted = formatBlogDate(dateString);
      expect(formatted).toContain("December");
      expect(formatted).toContain("2025");
    });

    it("should handle different date formats", () => {
      const dateString = "2025-01-01T00:00:00Z";
      const formatted = formatBlogDate(dateString);
      expect(formatted).toBeTruthy();
    });
  });

  describe("formatBlogDateShort", () => {
    it("should format date in short format", () => {
      const dateString = "2025-12-15T10:00:00Z";
      const formatted = formatBlogDateShort(dateString);
      expect(formatted).toContain("Dec");
      expect(formatted).toContain("2025");
    });
  });

  describe("fetchBlogPosts", () => {
    it("should return mock posts in development when no API configured", async () => {
      // Mock environment variables
      const originalEnv = import.meta.env;
      vi.stubEnv("VITE_BLOG_API_URL", "");
      vi.stubEnv("VITE_BLOG_RSS_URL", "");
      vi.stubEnv("DEV", "true");

      const posts = await fetchBlogPosts();
      expect(posts.length).toBeGreaterThan(0);
    });

    it("should handle API fetch errors gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.stubEnv("VITE_BLOG_API_URL", "https://api.example.com/posts");
      vi.stubEnv("DEV", "true");

      const posts = await fetchBlogPosts();
      // Should fallback to mock posts in dev
      expect(Array.isArray(posts)).toBe(true);
    });
  });
});


