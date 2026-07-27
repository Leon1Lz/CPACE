/**
 * lib/sanitize.ts
 *
 * Central HTML sanitization utility using isomorphic-dompurify.
 * Works on both server (Node/jsdom) and client (real DOM).
 *
 * Usage:
 *   import { sanitizeHtml, sanitizeHtmlStrict } from "@/lib/sanitize"
 *
 *   // On write (API route) — strip everything dangerous before saving
 *   const clean = sanitizeHtml(userHtml)
 *
 *   // For plain-text contexts — strip ALL tags
 *   const text = stripTags(rawHtml)
 */

import DOMPurify from "isomorphic-dompurify"

/**
 * Standard rich-text sanitization.
 * Allows safe formatting tags (headings, lists, links, code, etc.)
 * but removes <script>, event handlers, data: URIs, and javascript: hrefs.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ""
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "strike", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "mark", "span", "div",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "target", "rel",
      // text-align from TipTap
      "style",
    ],
    // Prevent javascript: and data: URIs in href/src
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
}

/**
 * Strict sanitization — strips ALL HTML tags, returns plain text.
 * Use for meta descriptions, search indexes, or excerpt generation.
 */
export function stripTags(dirty: string): string {
  if (!dirty) return ""
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Sanitize and also enforce that external links open in a new tab safely.
 */
export function sanitizeHtmlWithLinks(dirty: string): string {
  const clean = sanitizeHtml(dirty)
  // Post-process: add rel="noopener noreferrer" to all external links
  return clean.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  )
}
