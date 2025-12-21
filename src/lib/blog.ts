/**
 * Blog utilities for fetching and managing blog posts
 * Supports multiple data sources: API, RSS feed, CMS, or static content
 */

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author?: string;
  publishedAt: string;
  imageUrl?: string;
  externalUrl?: string;
  readTime?: number;
  tags?: string[];
}

/**
 * Fetch blog posts from configured source
 * Priority: API endpoint > RSS feed > Static content
 */
export const fetchBlogPosts = async (limit?: number): Promise<BlogPost[]> => {
  const apiUrl = import.meta.env.VITE_BLOG_API_URL;
  const rssUrl = import.meta.env.VITE_BLOG_RSS_URL;

  try {
    // Try API endpoint first
    if (apiUrl) {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        const posts = Array.isArray(data) ? data : data.posts || [];
        return limit ? posts.slice(0, limit) : posts;
      }
    }

    // Try RSS feed
    if (rssUrl) {
      const posts = await fetchRSSFeed(rssUrl);
      return limit ? posts.slice(0, limit) : posts;
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
  }

  // Fallback to empty array or mock data in development
  if (import.meta.env.DEV) {
    return getMockPosts(limit);
  }

  return [];
};

/**
 * Fetch and parse RSS feed
 */
const fetchRSSFeed = async (rssUrl: string): Promise<BlogPost[]> => {
  try {
    // Use a CORS proxy or backend endpoint for RSS parsing
    // RSS parsing requires server-side processing or a CORS-enabled RSS parser
    const proxyUrl = import.meta.env.VITE_RSS_PROXY_URL || rssUrl;
    const response = await fetch(proxyUrl);
    const text = await response.text();
    
    // Parse RSS XML (simplified - use a proper RSS parser library in production)
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = xml.querySelectorAll("item");
    
    return Array.from(items).map((item, index) => {
      const title = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      const author = item.querySelector("author")?.textContent || item.querySelector("dc:creator")?.textContent || "";
      
      return {
        id: `rss-${index}`,
        title,
        excerpt: description.substring(0, 200) + (description.length > 200 ? "..." : ""),
        content: description,
        author,
        publishedAt: pubDate,
        externalUrl: link,
        readTime: Math.ceil(description.length / 1000), // Rough estimate
      };
    });
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    return [];
  }
};

/**
 * Get mock blog posts for development/testing
 */
export const getMockPosts = (limit?: number): BlogPost[] => {
  const mockPosts: BlogPost[] = [
    {
      id: "1",
      title: "JengaHacks 2026: What to Expect",
      excerpt: "Get ready for East Africa's premier hackathon! Learn about the tracks, prizes, and what makes JengaHacks special.",
      author: "JengaHacks Team",
      publishedAt: "2025-12-15T10:00:00Z",
      readTime: 5,
      tags: ["announcement", "event"],
    },
    {
      id: "2",
      title: "Meet Our Sponsors: Building the Future Together",
      excerpt: "We're thrilled to introduce our amazing sponsors who are making JengaHacks 2026 possible.",
      author: "JengaHacks Team",
      publishedAt: "2025-12-10T14:30:00Z",
      readTime: 3,
      tags: ["sponsors", "partners"],
    },
    {
      id: "3",
      title: "Hackathon Tips: How to Make the Most of 48 Hours",
      excerpt: "Expert advice on time management, team formation, and building a winning project at JengaHacks.",
      author: "JengaHacks Team",
      publishedAt: "2025-12-05T09:15:00Z",
      readTime: 7,
      tags: ["tips", "guide"],
    },
    {
      id: "4",
      title: "Registration Now Open: Secure Your Spot",
      excerpt: "Registration for JengaHacks 2026 is now open! Limited to 200 participants. Don't miss out on this incredible opportunity.",
      author: "JengaHacks Team",
      publishedAt: "2025-12-01T08:00:00Z",
      readTime: 2,
      tags: ["registration", "announcement"],
    },
  ];

  return limit ? mockPosts.slice(0, limit) : mockPosts;
};

/**
 * Format date for display
 */
export const formatBlogDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format date for short display
 */
export const formatBlogDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

