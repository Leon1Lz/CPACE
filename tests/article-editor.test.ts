import { afterEach, describe, expect, it } from "vitest"
import { Editor } from "@tiptap/core"
import { createArticleExtensions } from "@/components/insights/editor-extensions"
import { getFacebookEmbedUrl, getLinkedInEmbedUrl, getYouTubeEmbedUrl, isArticleImageUrl, sanitizeArticleHtml } from "@/lib/article-html"

const embed = "https://www.linkedin.com/embed/feed/update/urn:li:activity:7251234567890123456"
const ytEmbed = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
const fbEmbed = "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fcpaceph%2Fposts%2Fpfbid02xyz&show_text=true&width=500"
const editors: Editor[] = []
afterEach(() => { editors.splice(0).forEach(editor => editor.destroy()) })

describe("advanced article content", () => {
  it("recognizes LinkedIn post URLs and official embed code", () => {
    expect(getLinkedInEmbedUrl('https://www.linkedin.com/posts/cpace_insights-activity-7251234567890123456-test?utm_source=share')).toBe(embed)
    expect(getLinkedInEmbedUrl(`<iframe src="${embed}" height="650"></iframe>`)).toBe(embed)
    expect(getLinkedInEmbedUrl("https://www.linkedin.com.evil.test/embed/feed/update/urn:li:activity:7251234567890123456")).toBeNull()
    expect(getLinkedInEmbedUrl("https://www.linkedin.com/in/profile")).toBeNull()
  })

  it("recognizes Facebook post URLs, share links and official iframe embed code", () => {
    expect(getFacebookEmbedUrl("https://www.facebook.com/cpaceph/posts/pfbid02xyz")).toBe(fbEmbed)
    expect(getFacebookEmbedUrl("https://web.facebook.com/cpaceph/posts/pfbid02xyz")).toBe(fbEmbed)
    expect(getFacebookEmbedUrl(`<iframe src="${fbEmbed}" width="500" height="680"></iframe>`)).toBe(fbEmbed)
    expect(getFacebookEmbedUrl("https://www.facebook.com/share/p/1B6DyMQimT/")).toBe(
      "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fp%2F1B6DyMQimT%2F&show_text=true&width=500"
    )
    expect(getFacebookEmbedUrl("https://facebook.com.evil.test/cpaceph/posts/123")).toBeNull()
    expect(getFacebookEmbedUrl("https://www.facebook.com/")).toBeNull()
  })

  it("recognizes YouTube watch, short, share and embed URLs safely", () => {
    expect(getYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(ytEmbed)
    expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?si=test")).toBe(ytEmbed)
    expect(getYouTubeEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(ytEmbed)
    expect(getYouTubeEmbedUrl(`<iframe src="${ytEmbed}" height="420"></iframe>`)).toBe(ytEmbed)
    expect(getYouTubeEmbedUrl("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull()
  })

  it("retains article formatting, fonts, tables, YouTube videos, Facebook posts, images, lists and a constrained LinkedIn embed through save and reopen", () => {
    const input = `<h1 style="text-align: center"><span style="color: #008000; font-size: 32px; font-family: Georgia, serif">Operational excellence</span></h1><p style="text-align: justify; line-height: 1.75; margin-bottom: 24px">The complete article.</p><ul><li><p>A key point</p></li></ul><table><tbody><tr><th><p>Metric</p></th><th><p>Result</p></th></tr><tr><td><p>ROI</p></td><td><p>+42%</p></td></tr></tbody></table><img src="/assets/hero-bg.jpg" alt="Industry" style="width: 50%; margin-left: auto; margin-right: auto"><iframe src="${embed}" height="850"></iframe><iframe src="${fbEmbed}" height="680"></iframe><iframe src="${ytEmbed}" height="420"></iframe><h4>References</h4><p><a href="https://example.com">Source</a></p>`
    const first = new Editor({ extensions: createArticleExtensions(), content: sanitizeArticleHtml(input) })
    editors.push(first)
    const saved = sanitizeArticleHtml(first.getHTML())
    const reopened = new Editor({ extensions: createArticleExtensions(), content: saved })
    editors.push(reopened)
    const output = sanitizeArticleHtml(reopened.getHTML())
    expect(output).toContain("text-align: center")
    expect(output).toContain("font-size: 32px")
    expect(output).toContain("Georgia, serif")
    expect(output).toMatch(/color: (?:rgb\(0, 128, 0\)|#008000)/)
    expect(output).toContain("line-height: 1.75")
    expect(output).toContain("margin-bottom: 24px")
    expect(output).toContain("<ul>")
    expect(output).toContain("<table>")
    expect(output).toContain("<th><p>Metric</p></th>")
    expect(output).toContain("<td><p>+42%</p></td>")
    expect(output).toContain('alt="Industry"')
    expect(output).toContain("width: 50%")
    expect(output).toContain(`src="${embed}"`)
    expect(output).toContain('height="850"')
    expect(output).toContain('title="Facebook post"')
    expect(output).toContain('height="680"')
    expect(output).toContain(`src="${ytEmbed}"`)
    expect(output).toContain('height="420"')
    expect(output).toContain("<h4>References</h4>")
    expect(output).toContain('rel="noopener noreferrer"')
    expect(sanitizeArticleHtml(output)).toBe(output)
  })

  it("inserts and edits tables via editor commands", () => {
    const editor = new Editor({ extensions: createArticleExtensions(), content: "<p>Intro</p>" })
    editors.push(editor)
    expect(editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true })).toBe(true)
    const html = sanitizeArticleHtml(editor.getHTML())
    expect(html).toContain("<table>")
    expect(html).toContain("<th>")
    expect(html).toContain("<td>")
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
