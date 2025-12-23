/**
 * HTML sanitization utilities for safe rendering of external content
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content from external sources (e.g., RSS feeds, blog posts)
 * This prevents XSS attacks by removing dangerous HTML/JavaScript
 * 
 * @param html - Raw HTML string from external source
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (
  html: string,
  options?: {
    /** Allow specific HTML tags (default: basic formatting tags) */
    allowedTags?: string[];
    /** Allow specific HTML attributes */
    allowedAttributes?: Record<string, string[]>;
  }
): string => {
  if (!html || typeof html !== "string") {
    return "";
  }

  const allowedTags = options?.allowedTags || [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
  ];

  const allowedAttr = options?.allowedAttributes
    ? Object.values(options.allowedAttributes).flat()
    : ["href", "title", "target", "rel"];

  const config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttr,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    ADD_ATTR: ["target"],
  };

  return DOMPurify.sanitize(html, config);
};

/**
 * Sanitize and render HTML content safely
 * Use this when rendering content from external sources like Medium RSS feeds
 * 
 * @example
 * ```tsx
 * const blogContent = sanitizeHtml(mediumRssFeedItem.content);
 * <div dangerouslySetInnerHTML={{ __html: blogContent }} />
 * ```
 */
export const sanitizeForRender = (html: string): { __html: string } => {
  return {
    __html: sanitizeHtml(html),
  };
};

