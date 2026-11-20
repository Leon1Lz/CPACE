export const articleCategories = [
  { value: "Partnership", label: "Partnership", color: "bg-emerald-100 text-emerald-700 border-emerald-200", iconName: "users" },
  { value: "Industry Insights", label: "Industry Insights", color: "bg-blue-100 text-blue-700 border-blue-200", iconName: "trending-up" },
  { value: "Events", label: "Events", color: "bg-violet-100 text-violet-700 border-violet-200", iconName: "zap" },
  { value: "Technology", label: "Technology", color: "bg-orange-100 text-orange-700 border-orange-200", iconName: "globe" },
  { value: "News", label: "News", color: "bg-blue-100 text-blue-700 border-blue-200", iconName: "globe" },
  { value: "Marketing", label: "Marketing", color: "bg-pink-100 text-pink-700 border-pink-200", iconName: "trending-up" },
  { value: "Management", label: "Management", color: "bg-violet-100 text-violet-700 border-violet-200", iconName: "users" },
  { value: "Finance", label: "Finance", color: "bg-emerald-100 text-emerald-700 border-emerald-200", iconName: "trending-up" },
  { value: "Tourism and Hospitality", label: "Tourism and Hospitality", color: "bg-amber-100 text-amber-700 border-amber-200", iconName: "globe" },
]

type ArticleCategoryInput = { title: string; category?: string; sourceCategories?: string[] }

export function getArticleCategory(article: ArticleCategoryInput) {
  const selected = articleCategories.find(category => category.value === article.category)
  if (selected) return selected

  const source = article.sourceCategories || []
  let category = "Management"
  if (source.includes("Hospitality and Tourism") || /tourism|hospitality/i.test(article.title)) {
    category = "Tourism and Hospitality"
  } else if (source.includes("Marketing")) {
    category = "Marketing"
  } else if (source.includes("Finance") || /gcash|fintech|modernizing finance/i.test(article.title)) {
    category = "Finance"
  } else if (source.includes("Operations")) {
    category = "Management"
  } else if (article.category === "Partnership" || article.category === "Events" || source.includes("News")) {
    category = "News"
  } else if (/marketing/i.test(article.title)) {
    category = "Marketing"
  }
  return articleCategories.find(item => item.value === category)!
}
