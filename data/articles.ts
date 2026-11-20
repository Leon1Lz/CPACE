import importedArticles from "./articles.json"

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  categoryColor: string
  iconName: string
  image: string
  featured: boolean
  date?: string
  createdAt: string
  comments: number
  sourceId?: number
  sourceUrl?: string
  sourceCategories?: string[]
  previousArticleHash?: string
}

// Imported from the public CPACE archive; existing article URLs are preserved.
export const articlesData: Article[] = importedArticles

export function getAllArticles(): Article[] {
  return articlesData
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articlesData.find((a) => a.slug === slug)
}
