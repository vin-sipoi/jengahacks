import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import Blog from "./Blog";
import * as blogLib from "@/lib/blog";

// Mock the blog library
vi.mock("@/lib/blog", () => ({
  fetchBlogPosts: vi.fn(),
  formatBlogDate: vi.fn((date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }),
}));

describe("Blog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the page title", () => {
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue([]);
    const { container } = render(<Blog />);
    // Title is rendered immediately - check for the heading text
    expect(container.textContent).toMatch(/Blog/i);
    expect(container.textContent).toMatch(/News/i);
  });

  it("should show loading state initially", () => {
    vi.mocked(blogLib.fetchBlogPosts).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    render(<Blog />);
    expect(screen.getByText(/Loading posts/i)).toBeInTheDocument();
  });

  it("should render blog posts when loaded", async () => {
    const Posts = [
      {
        id: "1",
        title: "Test Post 1",
        excerpt: "Test excerpt 1",
        publishedAt: "2025-12-15T10:00:00Z",
        author: "Test Author",
        readTime: 5,
      },
      {
        id: "2",
        title: "Test Post 2",
        excerpt: "Test excerpt 2",
        publishedAt: "2025-12-10T10:00:00Z",
        author: "Test Author",
        readTime: 3,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue(Posts as any);

    render(<Blog />);

    await waitFor(() => {
      expect(screen.getByText("Test Post 1")).toBeInTheDocument();
      expect(screen.getByText("Test Post 2")).toBeInTheDocument();
    });
  });

  it("should show empty state when no posts", async () => {
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue([]);

    render(<Blog />);

    await waitFor(() => {
      expect(screen.getByText(/No blog posts available/i)).toBeInTheDocument();
    });
  });

  it("should render external link for posts with externalUrl", async () => {
    const Posts = [
      {
        id: "1",
        title: "External Post",
        excerpt: "Test excerpt",
        publishedAt: "2025-12-15T10:00:00Z",
        externalUrl: "https://example.com/post",
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(blogLib.fetchBlogPosts).mockResolvedValue(Posts as any);

    render(<Blog />);

    await waitFor(() => {
      const link = screen.getByText("Read More").closest("a");
      expect(link).toHaveAttribute("href", "https://example.com/post");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});

