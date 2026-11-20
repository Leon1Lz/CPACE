// Run with: node --import tsx scripts/import-legacy-articles.mjs
// Downloads public posts and images only; does not write to the database.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import DOMPurify from "isomorphic-dompurify"
import sharp from "sharp"
import { articlesData } from "../data/articles.ts"
import { getArticleCategory } from "../data/article-categories.ts"

const root = fileURLToPath(new URL("../", import.meta.url))
const existingSlugs = {
  3946: "cpace-good-samaritan-cmms-exam", 3902: "uc-students-cpace-certifications",
  3875: "beyond-the-paycheck-labor-law", 3683: "cpace-san-beda-partnership",
  3618: "beyond-job-titles", 3595: "fintech-revolution-summit-2026",
  3569: "chro-philippines-2026", 3524: "cpace-gordon-college-cfms",
  3531: "batstateu-cpace-accord", 3541: "nemsu-tagbina-cpace-collab",
  3554: "stop-forwarding-emails", 3488: "cpace-wlc-partnership",
  3969: "omsc-campuses-partnership-2026", 3799: "trimex-colleges-partnership-2026",
  3434: "ucc-ceremonial-signing-2025", 3927: "cmc-cpace-partnership",
  3752: "modernizing-finance-insights", 3741: "the-art-of-small-wins",
  3832: "the-digital-pivot", 3768: "gcash-digital-payments-transformation",
}
const document = new JSDOM("").window.document
function plain(html) {
  const element = document.createElement("div")
  element.innerHTML = html
  return element.textContent.replace(/[\u200b\ufeff]/g, "").replace(/\s+/g, " ").trim()
}
async function download(url) {
  const parsed = new URL(url)
  if (parsed.origin !== "https://cpaceph.com" || !parsed.pathname.startsWith("/wp-content/uploads/")) {
    throw new Error(`Unexpected media source: ${url}`)
  }
  const name = `${createHash("sha256").update(url).digest("hex").slice(0, 16)}.webp`
  const local = `/assets/articles/legacy/${name}`
  const destination = path.join(root, "public", local)
  try { await readFile(destination); return local } catch { /* Download missing assets. */ }
  const response = await fetch(url, { signal: globalThis.AbortSignal.timeout(60000) })
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`Image download failed: ${url} (${response.status})`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toFile(destination)
  return local
}

let posts = []
if (process.argv[2]) {
  posts = JSON.parse(await readFile(process.argv[2], "utf8"))
} else {
  let pages = 1
  for (let page = 1; page <= pages; page++) {
    const response = await fetch(`https://cpaceph.com/wp-json/wp/v2/posts?per_page=100&_embed&page=${page}`, { signal: globalThis.AbortSignal.timeout(60000) })
    if (!response.ok) throw new Error(`Post import failed: ${response.status}`)
    pages = Number(response.headers.get("x-wp-totalpages") || 1)
    posts.push(...await response.json())
  }
}
if (!posts.length || posts.some(post => post.status !== "publish")) throw new Error("Expected published posts")
await mkdir(path.join(root, "public/assets/articles/legacy"), { recursive: true })
const localLinks = new Map(posts.map(post => [new URL(post.link).pathname.replace(/\/$/, ""), `/insights/${existingSlugs[post.id] || post.slug}`]))
const imported = []
for (const post of posts) {
  const previous = articlesData.find(article => article.sourceId === post.id || article.slug === existingSlugs[post.id])
  const doc = new JSDOM(post.content.rendered).window.document
  doc.querySelectorAll('script, style, iframe, form, [data-widget_type="html.default"]').forEach(node => node.remove())
  const featuredUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || doc.querySelector("img")?.src
  if (!featuredUrl) throw new Error(`Missing image for ${post.slug}`)
  const image = await download(featuredUrl)
  for (const img of [...doc.images]) {
    if (img.src === featuredUrl) { img.remove(); continue }
    img.src = await download(img.src)
    img.removeAttribute("srcset")
    img.removeAttribute("sizes")
  }
  // Keep article headings, paragraphs, lists and links; remove Elementor layout.
  for (const element of [...doc.querySelectorAll("div, section, span")].reverse()) {
    element.replaceWith(...element.childNodes)
  }
  for (const link of doc.querySelectorAll("a[href]")) {
    try {
      const url = new URL(link.getAttribute("href"), post.link)
      const local = url.origin === "https://cpaceph.com" && localLinks.get(url.pathname.replace(/\/$/, ""))
      link.setAttribute("href", local || url.href)
    } catch {
      // Some legacy links contain a title instead of a URL. Preserve their text.
      link.removeAttribute("href")
    }
  }
  const content = DOMPurify.sanitize(doc.body.innerHTML, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr"],
    ALLOWED_ATTR: ["href", "src", "alt", "title"],
  }).replace(/<p>\s*<\/p>/g, "").replace(/\n\s*\n/g, "\n").trim()
  if (plain(content).length < 200) throw new Error(`Empty article: ${post.slug}`)
  const title = plain(post.title.rendered)
  const sourceCategories = post._embedded?.["wp:term"]?.flat().filter(term => term.taxonomy === "category").map(term => plain(term.name)) || []
  const { value: category, color: categoryColor, iconName } = getArticleCategory({ title, category: previous?.category || (sourceCategories.includes("Events") ? "Events" : ""), sourceCategories })
  const createdAt = `${post.date_gmt}Z`
  imported.push({
    id: previous?.id || `wp-${post.id}`, slug: previous?.slug || post.slug, title,
    excerpt: plain(post.excerpt.rendered), content, category, categoryColor, iconName, image,
    featured: imported.length === 0,
    date: new Date(`${post.date}Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
    createdAt, comments: 0, sourceId: post.id, sourceUrl: post.link, sourceCategories,
    ...(previous ? { previousArticleHash: previous.previousArticleHash || createHash("sha256").update(JSON.stringify([previous.title, previous.excerpt, previous.content, previous.category, previous.categoryColor, previous.iconName, previous.image, previous.featured])).digest("hex") } : {}),
  })
  console.log(`Imported ${imported.length}/${posts.length}: ${post.slug}`)
}
const importedSlugs = new Set(imported.map(article => article.slug))
const retained = articlesData.filter(article => !importedSlugs.has(article.slug))
const articles = [...imported, ...retained].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
if (new Set(articles.map(article => article.slug)).size !== articles.length) throw new Error("Duplicate article slugs")
await writeFile(path.join(root, "data/articles.json"), `${JSON.stringify(articles, null, 2)}\n`)
console.log(JSON.stringify({ imported: imported.length, retained: retained.length, total: articles.length }))
