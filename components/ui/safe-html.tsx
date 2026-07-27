"use client"

import { useMemo } from "react"
import { sanitizeHtml, sanitizeHtmlWithLinks } from "@/lib/sanitize"
import { cn } from "@/lib/utils"

interface SafeHtmlProps {
  /** Raw HTML string (may be from user input or DB) */
  html: string
  /** Extra CSS classes for the wrapper div */
  className?: string
  /** If true, external links get target=_blank + rel=noopener automatically */
  externalLinks?: boolean
}

/**
 * SafeHtml — renders user-supplied HTML safely via DOMPurify.
 *
 * Always use this instead of:
 *   <div dangerouslySetInnerHTML={{ __html: userContent }} />
 *
 * Usage:
 *   <SafeHtml html={module.content} className="prose prose-sm max-w-none" />
 */
export function SafeHtml({ html, className, externalLinks = false }: SafeHtmlProps) {
  const cleanHtml = useMemo(() => {
    if (!html) return ""
    return externalLinks ? sanitizeHtmlWithLinks(html) : sanitizeHtml(html)
  }, [html, externalLinks])

  if (!cleanHtml) return null

  return (
    <div
      className={cn("safe-html", className)}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
