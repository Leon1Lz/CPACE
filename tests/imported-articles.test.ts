import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import path from "node:path"
import { articlesData } from "@/data/articles"
import { getFacebookEmbedUrl, getLinkedInEmbedUrl, getYouTubeEmbedUrl } from "@/lib/article-html"

describe("imported CPACE archive", () => {
  it("includes all 51 source posts without duplicates and retains existing entries", () => {
    const imported = articlesData.filter(article => article.sourceId !== undefined)
    expect(imported).toHaveLength(51)
    expect(new Set(imported.map(article => article.sourceId)).size).toBe(51)
    expect(new Set(articlesData.map(article => article.slug)).size).toBe(articlesData.length)
    expect(articlesData).toHaveLength(53)
    expect(articlesData.filter(article => article.id.startsWith("art-"))).toHaveLength(22)
  })

  it("keeps content, valid dates, safe social embeds and local images for every imported article", () => {
    for (const article of articlesData.filter(article => article.sourceId !== undefined)) {
      expect(article.content.length).toBeGreaterThan(200)
      expect(Number.isFinite(Date.parse(article.createdAt))).toBe(true)
      expect(article.sourceUrl).toMatch(/^https:\/\/cpaceph\.com\//)
      expect(existsSync(path.join(process.cwd(), "public", article.image))).toBe(true)
      expect(article.content).not.toMatch(/<script|\son\w+=|data-elementor|javascript:/i)
      for (const [, src] of article.content.matchAll(/<iframe[^>]*src="([^"]+)"/g)) {
        expect(Boolean(getFacebookEmbedUrl(src) || getLinkedInEmbedUrl(src) || getYouTubeEmbedUrl(src))).toBe(true)
      }
      for (const [, src] of article.content.matchAll(/<img[^>]*src="([^"]+)"/g)) {
        expect(src).toMatch(/^\/assets\/articles\/legacy\//)
        expect(existsSync(path.join(process.cwd(), "public", src))).toBe(true)
      }
    }
  })
})
