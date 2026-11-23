// Run with: node --import tsx scripts/import-legacy-articles.mjs
// Downloads public posts and images only; does not write to the database.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import https from "node:https"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import DOMPurify from "isomorphic-dompurify"
import sharp from "sharp"
import { articlesData } from "../data/articles.ts"
import { getArticleCategory } from "../data/article-categories.ts"
import { getFacebookEmbedUrl, getLinkedInEmbedUrl, getYouTubeEmbedUrl, sanitizeArticleHtml } from "../lib/article-html.ts"

const LEGACY_WP_IP = process.env.LEGACY_WP_IP || "191.101.230.126"

function fetchFromLegacyWp(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const req = https.get(
      {
        host: LEGACY_WP_IP,
        port: 443,
        path: `${parsed.pathname}${parsed.search}`,
        servername: parsed.hostname,
        headers: {
          Host: parsed.hostname,
          "User-Agent": "CPACE-Legacy-Importer/1.0",
        },
        timeout: 60000,
      },
      res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          const nextUrl = new URL(res.headers.location, url).href
          fetchFromLegacyWp(nextUrl).then(resolve, reject)
          return
        }
        const chunks = []
        res.on("data", chunk => chunks.push(chunk))
        res.on("end", () => {
          resolve({
            ok: Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 300),
            status: res.statusCode || 0,
            headers: {
              get(name) {
                const val = res.headers[name.toLowerCase()]
                return Array.isArray(val) ? val.join(", ") : val || null
              },
            },
             buffer: Buffer.concat(chunks),
          })
        })
      }
    )
    req.on("error", reject)
    req.on("timeout", () => {
      req.destroy(new Error(`Request timeout: ${url}`))
    })
  })
}

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
  const response = await fetchFromLegacyWp(url)
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error(`Image download failed: ${url} (${response.status})`)
  }
  const buffer = response.buffer
  await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toFile(destination)
  return local
}

let posts = []
if (process.argv[2]) {
  posts = JSON.parse(await readFile(process.argv[2], "utf8"))
} else {
  let pages = 1
  for (let page = 1; page <= pages; page++) {
    const response = await fetchFromLegacyWp(`https://cpaceph.com/wp-json/wp/v2/posts?per_page=100&_embed&page=${page}`)
    if (!response.ok) throw new Error(`Post import failed: ${response.status}`)
    pages = Number(response.headers.get("x-wp-totalpages") || 1)
    posts.push(...JSON.parse(response.buffer.toString("utf8")))
  }
}
if (!posts.length || posts.some(post => post.status !== "publish")) throw new Error("Expected published posts")
await mkdir(path.join(root, "public/assets/articles/legacy"), { recursive: true })
const localLinks = new Map(posts.map(post => [new URL(post.link).pathname.replace(/\/$/, ""), `/insights/${existingSlugs[post.id] || post.slug}`]))
const imported = []
for (const post of posts) {
  const previous = articlesData.find(article => article.sourceId === post.id || article.slug === existingSlugs[post.id])
  const doc = new JSDOM(post.content.rendered).window.document
  doc.querySelectorAll("script, style, form").forEach(node => node.remove())
  for (const frame of [...doc.querySelectorAll("iframe")]) {
    const rawSrc = frame.getAttribute("src") || ""
    const safeSrc = getFacebookEmbedUrl(rawSrc) || getLinkedInEmbedUrl(rawSrc) || getYouTubeEmbedUrl(rawSrc)
    if (!safeSrc) {
      frame.remove()
      continue
    }
    const height = Number(frame.getAttribute("height")) || 680
    for (const attr of [...frame.attributes]) frame.removeAttribute(attr.name)
    frame.setAttribute("src", safeSrc)
    frame.setAttribute("height", String(height))
  }
  const featuredUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || doc.querySelector("img")?.src
  if (!featuredUrl) throw new Error(`Missing image for ${post.slug}`)
  const image = await download(featuredUrl)
  for (const img of [...doc.images]) {
    if (img.src === featuredUrl) { img.remove(); continue }
    img.src = await download(img.src)
    img.removeAttribute("srcset")
    img.removeAttribute("sizes")
  }
  // Keep article headings, paragraphs, lists, links and safe social embeds; remove Elementor layout.
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
  const rawHtml = DOMPurify.sanitize(doc.body.innerHTML, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr", "iframe"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "width", "height"],
  }).replace(/<p>\s*<\/p>/g, "").replace(/\n\s*\n/g, "\n").trim()
  const content = sanitizeArticleHtml(rawHtml)
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
