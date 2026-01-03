/**
 * HTML sanitization utilities for safe rendering of external content
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content from blog posts
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

  // More restrictive tag list - removed iframe and video for better security
  // Only allow basic formatting and safe media tags
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
    // Removed: "video", "source", "iframe" for better security
    // Add back only if absolutely necessary with strict CSP
  ];

  // Restrictive attribute list - removed potentially dangerous attributes
  const allowedAttr = options?.allowedAttributes
    ? Object.values(options.allowedAttributes).flat()
    : [
        "href", 
        "title", 
        "target", 
        "rel", 
        // Removed: "src", "poster", "controls", "preload", "width", "height", 
        // "frameborder", "allow", "allowfullscreen" for better security
        // Only allow "class" if needed for styling
      ];

  const config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttr,
    ALLOW_DATA_ATTR: false, // Never allow data attributes
    KEEP_CONTENT: true,
    ADD_ATTR: ["target"], // Add target="_blank" to links
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"], // Explicitly forbid dangerous tags
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"], // Forbid event handlers and inline styles
  };

  return DOMPurify.sanitize(html, config);
};

/**
 * Sanitize and render HTML content safely
 * Use this when rendering HTML content from blog posts
 * 
 * @example
 * ```tsx
 * const blogContent = sanitizeHtml(blogPost.content);
 * <div dangerouslySetInnerHTML={{ __html: blogContent }} />
 * ```
 */
export const sanitizeForRender = (html: string): { __html: string } => {
  return {
    __html: sanitizeHtml(html),
  };
};

