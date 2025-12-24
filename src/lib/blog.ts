/**
 * Blog utilities for fetching and managing blog posts
 * Uses local JSON file (blog.json) as the primary data source
 * Optionally supports API endpoint as a fallback
 */

import { logger } from "./logger";
import blogData from "@/content/blog.json";

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
 * Get blog posts from local JSON file
 * This is the primary data source for blog posts
 */
export const getPosts = (limit?: number): BlogPost[] => {
  const posts = blogData as BlogPost[];

  // Sort by date descending
  const sortedPosts = [...posts].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return limit ? sortedPosts.slice(0, limit) : sortedPosts;
};

/**
 * Fetch blog posts from configured source
 * Priority: Local JSON file > API endpoint (if configured)
 */
export const fetchBlogPosts = async (limit?: number): Promise<BlogPost[]> => {
  // Always use local JSON file first
  try {
    const posts = getPosts(limit);
    if (posts.length > 0) {
      return posts;
    }
  } catch (error) {
    logger.error("Error loading blog posts from local file", error instanceof Error ? error : new Error(String(error)));
  }

  // Fallback to API endpoint if configured (optional)
  const apiUrl = import.meta.env.VITE_BLOG_API_URL;
  if (apiUrl) {
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        const posts = Array.isArray(data) ? data : data.posts || [];
        return limit ? posts.slice(0, limit) : posts;
      }
    } catch (error) {
      logger.error("Error fetching blog posts from API", error instanceof Error ? error : new Error(String(error)), { apiUrl });
    }
  }

  return [];
};

import { formatDate as i18nFormatDate, formatDateShort as i18nFormatDateShort } from "./i18n";

/**
 * Format date for display
 * @deprecated Use formatDate from @/lib/i18n instead
 */
export const formatBlogDate = (dateString: string): string => {
  return i18nFormatDate(dateString);
};

/**
 * Format date for short display
 * @deprecated Use formatDateShort from @/lib/i18n instead
 */
export const formatBlogDateShort = (dateString: string): string => {
  return i18nFormatDateShort(dateString);
};

/**
 * Fetch a single blog post by ID
 * Uses local JSON file as primary source
 */
export const fetchBlogPost = async (id: string): Promise<BlogPost | null> => {
  // Always check local JSON file first
  try {
    const posts = getPosts();
    const post = posts.find((post) => post.id === id);
    if (post) {
      return post;
    }
  } catch (error) {
    logger.error("Error loading blog post from local file", error instanceof Error ? error : new Error(String(error)), { id });
  }

  // Fallback to API endpoint if configured (optional)
  const apiUrl = import.meta.env.VITE_BLOG_API_URL;
  if (apiUrl) {
    try {
      // Try individual post endpoint first
      const postUrl = `${apiUrl}/${id}`;
      const response = await fetch(postUrl);
      if (response.ok) {
        const post = await response.json();
        return post;
      }

      // Fallback: fetch all posts and find by ID
      const responseAll = await fetch(apiUrl);
      if (responseAll.ok) {
        const data = await responseAll.json();
        const posts = Array.isArray(data) ? data : data.posts || [];
        return posts.find((post: BlogPost) => post.id === id) || null;
      }
    } catch (error) {
      logger.error("Error fetching blog post from API", error instanceof Error ? error : new Error(String(error)), { id, apiUrl });
    }
  }

  return null;
};

/**
 * Generate a slug from a blog post title or ID
 */
export const generateSlug = (titleOrId: string): string => {
  return titleOrId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

