import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import BlogPreview from "./BlogPreview";
import * as blogLib from "@/lib/blog";

// Mock the blog library
vi.mock("@/lib/blog", () => ({
  fetchBlogPosts: vi.fn(),
  formatBlogDateShort: vi.fn((date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }),
}));

// Mock translations
vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        "blog.latest": "Latest News",
        "blog.latestSubtitle": "Stay updated with announcements, insights, and stories from JengaHacks",
        "blog.viewAll": "View All Posts",
        "blog.title": "Blog & News",
        "blog.by": "By",
        "common.readMore": "Read More",
      };
      let translation = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(`{${paramKey}}`, String(paramValue));
        });
      }
      return translation;
    },
  }),
}));

describe("BlogPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the section heading", async () => {
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue([]);
    render(<BlogPreview />);
    await waitFor(() => {
      expect(screen.getByText("Latest News")).toBeInTheDocument();
    });
  });

  it("should render blog posts when available", async () => {
    const mockPosts = [
      {
        id: "1",
        title: "Test Post 1",
        excerpt: "Test excerpt 1",
        publishedAt: "2025-12-15T10:00:00Z",
        author: "Test Author",
      },
      {
        id: "2",
        title: "Test Post 2",
        excerpt: "Test excerpt 2",
        publishedAt: "2025-12-10T10:00:00Z",
        author: "Test Author",
      },
    ];

    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue(mockPosts as any);

    render(<BlogPreview />);

    await waitFor(() => {
      expect(screen.getByText("Test Post 1")).toBeInTheDocument();
      expect(screen.getByText("Test Post 2")).toBeInTheDocument();
    });
  });

  it("should render View Blog button when no posts", async () => {
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue([]);

    render(<BlogPreview />);

    await waitFor(() => {
      const button = screen.getByText(/Blog/i);
      expect(button).toBeInTheDocument();
    });
  });

  it("should render View All Posts button when posts are available", async () => {
    const mockPosts = [
      {
        id: "1",
        title: "Test Post",
        excerpt: "Test excerpt",
        publishedAt: "2025-12-15T10:00:00Z",
      },
    ];

    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue(mockPosts as any);

    render(<BlogPreview />);

    await waitFor(() => {
      const button = screen.getByText("View All Posts");
      expect(button).toBeInTheDocument();
    });
  });

  it("should have link to blog page", async () => {
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue([]);

    render(<BlogPreview />);

    await waitFor(() => {
      const link = screen.getByText(/Blog/i).closest("a");
      expect(link).toHaveAttribute("href", "/blog");
    });
  });
});

