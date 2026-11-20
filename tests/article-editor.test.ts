import { afterEach, describe, expect, it } from "vitest"
import { Editor } from "@tiptap/core"
import { createArticleExtensions } from "@/components/insights/editor-extensions"
import { getLinkedInEmbedUrl, isArticleImageUrl, sanitizeArticleHtml } from "@/lib/article-html"

const embed = "https://www.linkedin.com/embed/feed/update/urn:li:activity:7251234567890123456"
const editors: Editor[] = []
afterEach(() => { editors.splice(0).forEach(editor => editor.destroy()) })

describe("advanced article content", () => {
  it("recognizes LinkedIn post URLs and official embed code", () => {
    expect(getLinkedInEmbedUrl('https://www.linkedin.com/posts/cpace_insights-activity-7251234567890123456-test?utm_source=share')).toBe(embed)
    expect(getLinkedInEmbedUrl(`<iframe src="${embed}" height="650"></iframe>`)).toBe(embed)
    expect(getLinkedInEmbedUrl("https://www.linkedin.com.evil.test/embed/feed/update/urn:li:activity:7251234567890123456")).toBeNull()
    expect(getLinkedInEmbedUrl("https://www.linkedin.com/in/profile")).toBeNull()
  })

  it("retains article formatting, images, lists and a constrained LinkedIn embed through save and reopen", () => {
    const input = `<h1 style="text-align: center"><span style="color: #008000; font-size: 32px">Operational excellence</span></h1><p style="text-align: justify; line-height: 1.75; margin-bottom: 24px">The complete article.</p><ul><li><p>A key point</p></li></ul><img src="/assets/hero-bg.jpg" alt="Industry" style="width: 50%; margin-left: auto; margin-right: auto"><iframe src="${embed}" height="850"></iframe><h4>References</h4><p><a href="https://example.com">Source</a></p>`
    const first = new Editor({ extensions: createArticleExtensions(), content: sanitizeArticleHtml(input) })
    editors.push(first)
    const saved = sanitizeArticleHtml(first.getHTML())
    const reopened = new Editor({ extensions: createArticleExtensions(), content: saved })
    editors.push(reopened)
    const output = sanitizeArticleHtml(reopened.getHTML())
    expect(output).toContain("text-align: center")
    expect(output).toContain("font-size: 32px")
    expect(output).toMatch(/color: (?:rgb\(0, 128, 0\)|#008000)/)
    expect(output).toContain("line-height: 1.75")
    expect(output).toContain("margin-bottom: 24px")
    expect(output).toContain("<ul>")
    expect(output).toContain('alt="Industry"')
    expect(output).toContain("width: 50%")
    expect(output).toContain(`src="${embed}"`)
    expect(output).toContain('height="850"')
    expect(output).toContain("<h4>References</h4>")
    expect(output).toContain('rel="noopener noreferrer"')
    expect(sanitizeArticleHtml(output)).toBe(output)
  })

  it("removes unsafe frames, scripts, event handlers and layout injection while keeping safe styling", () => {
    const html = sanitizeArticleHtml(`<script>alert(1)</script><iframe src="https://evil.example" srcdoc="bad"></iframe><iframe src="${embed}" onload="alert(1)" srcdoc="bad" height="99999"></iframe><p style="position:fixed; top:0; background-image:url(https://evil.example); color:#008000">Text</p><img src="javascript:alert(1)" onerror="alert(1)"><a href="javascript:alert(1)">link</a>`)
    expect(html).not.toMatch(/script>|srcdoc|onload|onerror|javascript:|evil\.example|position:|background-image/)
    expect(html).toContain('height="1200"')
    expect(html).toContain("sandbox=")
    expect(html).toContain("Text")
  })

  it("supports uploaded raster images and existing local filenames, but rejects SVG uploads", () => {
    const raster = "data:image/webp;base64,UklGRg=="
    expect(isArticleImageUrl(raster)).toBe(true)
    expect(sanitizeArticleHtml(`<img src="${raster}" alt="Uploaded">`)).toContain(raster)
    expect(isArticleImageUrl("/assets/articles/Good Samaritan Colleges - June 30.jpg")).toBe(true)
    expect(isArticleImageUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false)
    expect(isArticleImageUrl("//evil.example/image.png")).toBe(false)
  })
})
