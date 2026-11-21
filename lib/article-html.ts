import DOMPurify from "isomorphic-dompurify"

/** Accept a public post URL or LinkedIn's embed code, never arbitrary frames. */
export function getLinkedInEmbedUrl(input: string): string | null {
  try {
    const source = input.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || input.trim()
    const url = new URL(source)
    if (url.protocol !== "https:" || !["www.linkedin.com", "linkedin.com"].includes(url.hostname) || url.username || url.password || url.port) return null
    const pathname = decodeURIComponent(url.pathname)
    const urn = pathname.match(/^\/(?:embed\/)?feed\/update\/(urn:li:(?:activity|share|ugcPost):\d{10,25})\/?$/)?.[1]
    const activity = pathname.startsWith("/posts/") && pathname.match(/-activity-(\d{10,25})(?:-|$)/)?.[1]
    return urn ? `https://www.linkedin.com/embed/feed/update/${urn}` : activity ? `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activity}` : null
  } catch {
    return null
  }
}

/** Accept a public YouTube watch/short/share/embed URL or iframe embed code, never arbitrary frames. */
export function getYouTubeEmbedUrl(input: string): string | null {
  try {
    const source = input.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || input.trim()
    const url = new URL(source)
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null
    const host = url.hostname.toLowerCase()
    let videoId: string | null = null
    if (host === "youtu.be") {
      videoId = url.pathname.slice(1).split("/")[0] || null
    } else if (["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v")
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/)
        videoId = match?.[1] || null
      }
    }
    if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null
    return `https://www.youtube-nocookie.com/embed/${videoId}`
  } catch {
    return null
  }
}

export function isArticleImageUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && [...value].every(character => character.charCodeAt(0) >= 32)) return true
  if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)) return value.length <= 750_000
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password
  } catch { return false }
}

export const ARTICLE_FONTS = [
  { label: "Default (Sans)", value: "" },
  { label: "Inter / Sans-serif", value: "Inter, system-ui, sans-serif" },
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Merriweather (Serif)", value: "Merriweather, Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Arial / Helvetica", value: "Arial, Helvetica, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Monospace (Code)", value: "'Geist Mono', monospace" },
] as const

const styleRules: Record<string, RegExp> = {
  color: /^(?:#[\da-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i,
  "background-color": /^(?:#[\da-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i,
  "font-size": /^(?:\d{1,2}(?:\.\d+)?(?:px|pt)|[0-3](?:\.\d+)?rem)$/,
  "font-family": /^(?:[A-Za-z0-9\s,'"-]{1,80})$/,
  "text-align": /^(?:left|center|right|justify)$/,
  "line-height": /^(?:[1-3](?:\.\d+)?|normal)$/,
  "margin-bottom": /^(?:0|\d{1,2}(?:\.\d+)?(?:px|rem))$/,
  "margin-left": /^(?:0(?:px)?|auto)$/,
  "margin-right": /^(?:0(?:px)?|auto)$/,
  width: /^(?:25|50|75|100)%$/,
}

/** Article-only policy, shared by saving, preview and public rendering. */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return ""
  const body = DOMPurify.sanitize(html, {
    RETURN_DOM: true,
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "code", "a", "img", "hr", "mark", "span", "div", "table", "thead", "tbody", "tr", "th", "td", "iframe"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "style", "width", "height", "start", "colspan", "rowspan"],
    ALLOW_DATA_ATTR: false,
  }) as HTMLElement

  for (const element of body.querySelectorAll<HTMLElement>("[style]")) {
    const styles: string[] = []
    for (const [property, allowed] of Object.entries(styleRules)) {
      const value = element.style.getPropertyValue(property).trim()
      if (allowed.test(value)) styles.push(`${property}: ${value}`)
    }
    element.removeAttribute("style")
    if (styles.length) element.setAttribute("style", styles.join("; "))
  }
  for (const image of body.querySelectorAll("img")) {
    if (!isArticleImageUrl(image.getAttribute("src") || "")) { image.remove(); continue }
    for (const attr of ["width", "height"]) {
      const value = Number(image.getAttribute(attr))
      if (!Number.isFinite(value) || value < 1 || value > 4000) image.removeAttribute(attr)
    }
    image.setAttribute("loading", "lazy")
  }
  for (const frame of body.querySelectorAll("iframe")) {
    const rawSrc = frame.getAttribute("src") || ""
    const linkedInSrc = getLinkedInEmbedUrl(rawSrc)
    const youTubeSrc = !linkedInSrc ? getYouTubeEmbedUrl(rawSrc) : null
    if (!linkedInSrc && !youTubeSrc) { frame.remove(); continue }
    const requestedHeight = Number(frame.getAttribute("height")) || (youTubeSrc ? 420 : 650)
    for (const attribute of [...frame.attributes]) frame.removeAttribute(attribute.name)
    if (linkedInSrc) {
      frame.setAttribute("src", linkedInSrc)
      frame.setAttribute("title", "LinkedIn post")
      frame.setAttribute("width", "504")
      frame.setAttribute("height", String(Math.min(1200, Math.max(300, requestedHeight))))
    } else if (youTubeSrc) {
      frame.setAttribute("src", youTubeSrc)
      frame.setAttribute("title", "YouTube video")
      frame.setAttribute("width", "720")
      frame.setAttribute("height", String(Math.min(720, Math.max(240, requestedHeight))))
      frame.setAttribute("allowfullscreen", "true")
    }
    frame.setAttribute("loading", "lazy")
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox")
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin")
  }
  for (const link of body.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") || ""
    if (!/^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href)) link.removeAttribute("href")
    else if (/^https?:\/\//i.test(href)) {
      link.setAttribute("target", "_blank")
      link.setAttribute("rel", "noopener noreferrer")
    }
  }
  return body.innerHTML
}
