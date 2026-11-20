import { describe, expect, it, vi } from "vitest"

const { original, imported } = vi.hoisted(() => {
  const original = {
    id: "db-1", slug: "existing-article", title: "Original title", excerpt: "Short copy",
    content: "<p>Original placeholder</p>", category: "News", categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconName: "users", image: "/old.jpg", featured: false, createdAt: "2026-01-01T00:00:00Z",
  }
  return { original, imported: { ...original, id: "static-1", title: "Source title", content: "<p>Full source article</p>", image: "/new.webp", comments: 0 } }
})

vi.mock("@/data/articles", async () => {
  const { createHash } = await import("node:crypto")
  return { articlesData: [{ ...imported, previousArticleHash: createHash("sha256").update(JSON.stringify([
    original.title, original.excerpt, original.content, original.category,
    original.categoryColor, original.iconName, original.image, original.featured,
  ])).digest("hex") }] }
})

import { mergeArticleCatalog, resolveImportedArticle } from "@/lib/article-catalog"

describe("legacy article catalog", () => {
  it("replaces unchanged placeholder content while preserving its database ID and URL", () => {
    expect(resolveImportedArticle(original)).toMatchObject({ id: original.id, slug: original.slug, content: imported.content, image: imported.image })
  })

  it("preserves staff changes, including metadata-only edits", () => {
    for (const changes of [{ title: "Edited title" }, { content: "<p>Staff article</p>" }, { image: "/staff.jpg" }, { featured: true }]) {
      expect(resolveImportedArticle({ ...original, ...changes })).toMatchObject({ ...original, ...changes, createdAt: "2026-01-01T00:00:00.000Z" })
    }
  })

  it("includes imported articles without a database row and avoids duplicate slugs", () => {
    expect(mergeArticleCatalog([])).toHaveLength(1)
    expect(mergeArticleCatalog([original])).toHaveLength(1)
  })

  it("retains custom articles and sorts newest first", () => {
    const custom = { ...original, id: "custom", slug: "custom", createdAt: new Date("2026-10-01") }
    expect(mergeArticleCatalog([original, custom]).map(article => article.slug)).toEqual(["custom", "existing-article"])
  })
})
