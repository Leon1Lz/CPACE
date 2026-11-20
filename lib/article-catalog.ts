import { createHash } from "node:crypto"
import { articlesData, type Article } from "@/data/articles"
import { getArticleCategory } from "@/data/article-categories"

type ManagedArticle = Omit<Article, "createdAt" | "comments"> & {
  createdAt: string | Date
  updatedAt?: string | Date
  comments?: number
}

export function resolveImportedArticle(article: ManagedArticle): Article {
  const imported = articlesData.find(item => item.slug === article.slug)
  const fingerprint = createHash("sha256").update(JSON.stringify([
    article.title, article.excerpt, article.content, article.category,
    article.categoryColor, article.iconName, article.image, article.featured,
  ])).digest("hex")
  // Upgrade only the original placeholder copy. Staff edits take precedence.
  if (imported?.previousArticleHash === fingerprint) {
    return { ...imported, id: article.id }
  }
  const category = getArticleCategory({ ...article, sourceCategories: imported?.sourceCategories })
  return {
    ...article,
    category: category.value,
    categoryColor: category.color,
    createdAt: new Date(article.createdAt).toISOString(),
    comments: article.comments ?? 0,
  }
}

export function mergeArticleCatalog(managed: ManagedArticle[]): Article[] {
  const slugs = new Set(managed.map(article => article.slug))
  return [
    ...managed.map(resolveImportedArticle),
    ...articlesData.filter(article => !slugs.has(article.slug)),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}
