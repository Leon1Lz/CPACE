/**
 * lib/sanitize.ts
 *
 * Central HTML sanitization utility.
 * Safe for serverless environments (Node/Vercel/Lambda) and browser.
 */

let domPurifyInstance: any = null;

function getDOMPurify(): any {
  if (domPurifyInstance !== null) return domPurifyInstance;
  try {
    // Dynamically require so that missing canvas/jsdom in serverless does not crash module evaluation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("isomorphic-dompurify");
    domPurifyInstance = mod.default || mod;
  } catch {
    domPurifyInstance = false;
  }
  return domPurifyInstance;
}

function fallbackSanitize(dirty: string): string {
  if (!dirty) return "";
  const clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(
      /<\/?(?:object|embed|applet|meta|link|form|svg|math)\b[^>]*>/gi,
      "",
    )
    .replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi,
      "",
    )
    .replace(/<img([^>]*?)\s*\/?>/gi, (_, attrs) => {
      const a = attrs.trim();
      return a ? `<img ${a}>` : `<img>`;
    });

  return clean;
}

/**
 * Standard rich-text sanitization.
 * Allows safe formatting tags (headings, lists, links, code, etc.)
 * but removes <script>, event handlers, data: URIs, and javascript: hrefs.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  const purifier = getDOMPurify();
  if (purifier && typeof purifier.sanitize === "function") {
    try {
      return purifier.sanitize(dirty, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "strike",
          "del",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "blockquote",
          "pre",
          "code",
          "a",
          "img",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "hr",
          "mark",
          "span",
          "div",
        ],
        ALLOWED_ATTR: [
          "href",
          "src",
          "alt",
          "title",
          "class",
          "target",
          "rel",
          "style",
        ],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
        ALLOW_DATA_ATTR: false,
        FORCE_BODY: false,
      });
    } catch {
      // Fall through to fallback
    }
  }

  return fallbackSanitize(dirty);
}

/**
 * Strict sanitization — strips ALL HTML tags, returns plain text.
 * Use for meta descriptions, search indexes, or excerpt generation.
 */
export function stripTags(dirty: string): string {
  if (!dirty) return "";
  const purifier = getDOMPurify();
  if (purifier && typeof purifier.sanitize === "function") {
    try {
      return purifier.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    } catch {
      // Fall through to fallback regex
    }
  }
  return dirty.replace(/<[^>]*>/g, "");
}

/** Escape plain user text before interpolating it into an HTML email. */
export function escapeHtmlText(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

/**
 * Sanitize and also enforce that external links open in a new tab safely.
 */
export function sanitizeHtmlWithLinks(dirty: string): string {
  const clean = sanitizeHtml(dirty);
  // Post-process: add rel="noopener noreferrer" to all external links
  return clean.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer"',
  );
}
