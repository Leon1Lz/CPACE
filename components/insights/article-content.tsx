"use client"

import { useMemo } from "react"
import { sanitizeArticleHtml } from "@/lib/article-html"
import { cn } from "@/lib/utils"

export function ArticleContent({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => sanitizeArticleHtml(content), [content])
  return <div className={cn("article-body", className)} dangerouslySetInnerHTML={{ __html: html }} />
}
