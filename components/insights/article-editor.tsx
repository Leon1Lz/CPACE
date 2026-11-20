"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Minus, Undo2, Redo2, Link2, Unlink, ImagePlus, Linkedin, Eraser, Trash2, Pencil, Eye, Monitor, Smartphone } from "lucide-react"
import { createArticleExtensions } from "./editor-extensions"
import { ArticleContent } from "./article-content"
import { getLinkedInEmbedUrl, isArticleImageUrl, sanitizeArticleHtml } from "@/lib/article-html"
import { prepareArticleImage } from "@/lib/article-image-upload"
import { cn } from "@/lib/utils"

function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled}
    onMouseDown={event => event.preventDefault()} onClick={onClick}
    className={cn("inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2 text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-30", active ? "bg-emerald-100 text-emerald-800" : "text-slate-600")}>
    {children}
  </button>
}

const selectClass = "h-9 max-w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"

function pickerColor(value: string | undefined, fallback: string) {
  if (/^#[\da-f]{6}$/i.test(value || "")) return value!
  const rgb = value?.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/)
  return rgb ? `#${rgb.slice(1).map(channel => Number(channel).toString(16).padStart(2, "0")).join("")}` : fallback
}

export function ArticleEditor({ value, onChange, title, banner, category }: {
  value: string; onChange: (value: string) => void; title: string; banner: string; category: string
}) {
  const [preview, setPreview] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [panel, setPanel] = useState<"link" | "image" | "embed" | null>(null)
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const lastValue = useRef(value)
  const extensions = useMemo(() => createArticleExtensions(), [])
  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: sanitizeArticleHtml(value),
    onUpdate({ editor: updated }) {
      const html = updated.getHTML()
      lastValue.current = html
      onChange(html)
    },
    editorProps: { attributes: { class: "article-body min-h-[480px] focus:outline-none", role: "textbox", "aria-label": "Article body", "aria-multiline": "true" } },
  })
  useEditorState({ editor, selector: ({ transactionNumber }) => transactionNumber })

  useEffect(() => {
    if (editor && value !== lastValue.current) {
      editor.commands.setContent(sanitizeArticleHtml(value), { emitUpdate: false })
      lastValue.current = value
    }
  }, [editor, value])

  if (!editor) return <div className="h-96 animate-pulse rounded-xl bg-slate-50" />
  const block = editor.isActive("heading") ? `h${editor.getAttributes("heading").level}` : "paragraph"
  const imageSelected = editor.isActive("image")
  const embedSelected = editor.isActive("linkedInEmbed")
  const textStyle = editor.getAttributes("textStyle")
  const blockAttributes = editor.getAttributes(editor.isActive("heading") ? "heading" : "paragraph")

  function openPanel(kind: "link" | "image" | "embed") {
    if (!editor) return
    setPanel(kind)
    setError("")
    setUrl(kind === "link" ? editor.getAttributes("link").href || "" : kind === "image" && imageSelected ? editor.getAttributes("image").src || "" : kind === "embed" && embedSelected ? editor.getAttributes("linkedInEmbed").src || "" : "")
    setAlt(imageSelected ? editor.getAttributes("image").alt || "" : "")
  }

  function insert() {
    if (!editor) return
    const input = url.trim()
    if (panel === "image") {
      if (!isArticleImageUrl(input)) { setError("Choose an image file, a local image path, or an HTTPS image URL."); return }
      if (imageSelected) editor.chain().focus().updateAttributes("image", { src: input, alt }).run()
      else editor.chain().focus().setImage({ src: input, alt }).run()
    } else if (panel === "embed") {
      const src = getLinkedInEmbedUrl(input)
      if (!src) { setError("Paste a LinkedIn post URL or the code from LinkedIn’s “Embed this post” option."); return }
      if (embedSelected) editor.chain().focus().updateAttributes("linkedInEmbed", { src }).run()
      else editor.chain().focus().insertContent([{ type: "linkedInEmbed", attrs: { src, height: 650 } }, { type: "paragraph" }]).run()
    } else {
      if (!/^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(input)) { setError("Enter a full URL starting with https://, or a local page path."); return }
      if (editor.state.selection.empty && !editor.isActive("link")) {
        editor.chain().focus().insertContent({ type: "text", text: input, marks: [{ type: "link", attrs: { href: input } }] }).run()
      } else editor.chain().focus().extendMarkRange("link").setLink({ href: input }).run()
    }
    setPanel(null)
  }

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2">
      <div className="flex gap-1" aria-label="Editor mode">
        <Tool label="Write" active={!preview} onClick={() => setPreview(false)}><Pencil size={15} />Write</Tool>
        <Tool label="Preview" active={preview} onClick={() => { setPreview(true); setPanel(null) }}><Eye size={15} />Preview</Tool>
      </div>
      <span className="text-xs text-slate-500">{editor.storage.characterCount.words()} words · Changes saved with Save Article</span>
    </div>

    <div className={preview ? "hidden" : "block"}>
      <div className="sticky top-0 z-10 border-b bg-white p-2 shadow-sm" role="region" aria-label="Article formatting">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-2">
          <select aria-label="Text style" className={selectClass} value={block} onChange={event => {
            const style = event.target.value
            if (style === "paragraph") editor.chain().focus().setParagraph().run()
            else editor.chain().focus().setHeading({ level: Number(style.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run()
          }}>
            <option value="paragraph">Paragraph</option>
            {[1, 2, 3, 4, 5, 6].map(level => <option key={level} value={`h${level}`}>Heading {level}</option>)}
          </select>
          <select aria-label="Font size" className={selectClass} value={textStyle.fontSize || ""} onChange={event => event.target.value ? editor.chain().focus().setFontSize(event.target.value).run() : editor.chain().focus().unsetFontSize().run()}>
            <option value="">Font size</option>{[12, 14, 16, 18, 20, 24, 32, 40, 48].map(size => <option key={size} value={`${size}px`}>{size} px</option>)}
          </select>
          <select aria-label="Line spacing" className={selectClass} value={blockAttributes.blockLineHeight || ""} onChange={event => editor.chain().focus().updateAttributes(editor.isActive("heading") ? "heading" : "paragraph", { blockLineHeight: event.target.value || null }).run()}>
            <option value="">Line spacing</option>{[1, 1.25, 1.5, 1.75, 2].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <select aria-label="Space after paragraph" className={selectClass} value={blockAttributes.paragraphSpacing || ""} onChange={event => editor.chain().focus().updateAttributes(editor.isActive("heading") ? "heading" : "paragraph", { paragraphSpacing: event.target.value || null }).run()}>
            <option value="">Paragraph spacing</option>{[0, 8, 16, 24, 32].map(size => <option key={size} value={`${size}px`}>{size} px after</option>)}
          </select>
          <label className="flex h-9 items-center gap-1 rounded-md border px-2 text-xs text-slate-600">Text
            <input aria-label="Text color" type="color" value={pickerColor(textStyle.color, "#008000")} onChange={event => editor.chain().focus().setColor(event.target.value).run()} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" />
          </label>
          <label className="flex h-9 items-center gap-1 rounded-md border px-2 text-xs text-slate-600">Highlight
            <input aria-label="Highlight color" type="color" value={pickerColor(editor.getAttributes("highlight").color, "#fef08a")} onChange={event => editor.chain().focus().setHighlight({ color: event.target.value }).run()} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-0.5 pt-2">
          <Tool label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></Tool>
          <Tool label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></Tool>
          <Tool label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Tool>
          <Tool label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Tool>
          <Tool label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline size={16} /></Tool>
          <Tool label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Tool>
          <span className="mx-1 h-5 border-l" />
          {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight], ["justify", AlignJustify]] as const).map(([alignment, Icon]) => <Tool key={alignment} label={`Align ${alignment}`} active={editor.isActive({ textAlign: alignment })} onClick={() => editor.chain().focus().setTextAlign(alignment).run()}><Icon size={16} /></Tool>)}
          <Tool label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Tool>
          <Tool label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Tool>
          <Tool label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Tool>
          <Tool label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></Tool>
          <Tool label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().resetAttributes("paragraph", ["textAlign", "paragraphSpacing", "blockLineHeight"]).run()}><Eraser size={16} /></Tool>
          <span className="mx-1 h-5 border-l" />
          <Tool label="Insert or edit link" active={editor.isActive("link")} onClick={() => openPanel("link")}><Link2 size={16} /></Tool>
          <Tool label="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}><Unlink size={16} /></Tool>
          <Tool label="Insert image" onClick={() => openPanel("image")}><ImagePlus size={16} />Image</Tool>
          <Tool label="Embed LinkedIn post" onClick={() => openPanel("embed")}><Linkedin size={16} />LinkedIn</Tool>
        </div>
      </div>

      {panel && <div className="space-y-3 border-b bg-emerald-50/50 p-4" role="region" aria-label={`Insert ${panel}`}>
        <label className="block text-sm font-semibold text-slate-800">{panel === "image" ? "Image URL or local path" : panel === "embed" ? "LinkedIn post URL or embed code" : "Link URL"}
          <input aria-label={panel === "image" ? "Image URL" : panel === "embed" ? "LinkedIn URL or embed code" : "Link URL"} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal" value={url.startsWith("data:") ? "" : url} onChange={event => setUrl(event.target.value)} placeholder={url.startsWith("data:") ? "Uploaded image ready" : panel === "image" ? "https://… or /assets/…" : "https://…"} />
        </label>
        {panel === "image" && <>
          {url && isArticleImageUrl(url) && <img src={url} alt={alt || "Image preview"} className="h-24 max-w-full rounded-md object-contain" />}
          <label className="block text-sm text-slate-700">Image description (alt text)<input aria-label="Image description" className="mt-1 w-full rounded-lg border bg-white px-3 py-2" value={alt} onChange={event => setAlt(event.target.value)} placeholder="Describe the image for readers using screen readers" /></label>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="cursor-pointer rounded-lg border bg-white px-3 py-2 font-semibold">{uploading ? "Preparing image…" : "Upload image"}
              <input aria-label="Upload article image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={async event => {
                const file = event.target.files?.[0]
                if (!file) return
                setUploading(true); setError("")
                try { setUrl(await prepareArticleImage(file)); if (!alt) setAlt(file.name.replace(/\.[^.]+$/, "")) }
                catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to prepare image.") }
                finally { setUploading(false); event.target.value = "" }
              }} />
            </label>
            {banner && <button type="button" className="text-emerald-800 underline" onClick={() => setUrl(banner)}>Use banner image</button>}
            <span className="text-slate-500">JPG, PNG, or WebP · up to 10 MB</span>
          </div>
        </>}
        {panel === "embed" && <p className="text-xs text-slate-500">Paste a public post URL or copy “Embed this post” from LinkedIn. View it in Preview.</p>}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={uploading} onClick={insert} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply {panel}</button>
          <button type="button" onClick={() => { setPanel(null); editor.commands.focus() }} className="rounded-lg border px-3 py-2 text-sm">Cancel</button>
        </div>
      </div>}

      {(imageSelected || embedSelected) && <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-4 py-2 text-xs">
        <strong>{imageSelected ? "Selected image" : "Selected LinkedIn post"}</strong>
        {imageSelected ? <>
          <select aria-label="Image width" className={selectClass} value={editor.getAttributes("image").displayWidth || "100%"} onChange={event => editor.chain().focus().updateAttributes("image", { displayWidth: event.target.value }).run()}>{[25, 50, 75, 100].map(width => <option key={width} value={`${width}%`}>{width}% width</option>)}</select>
          <select aria-label="Image alignment" className={selectClass} value={editor.getAttributes("image").imageAlign || "center"} onChange={event => editor.chain().focus().updateAttributes("image", { imageAlign: event.target.value }).run()}>{["left", "center", "right"].map(align => <option key={align} value={align}>{align}</option>)}</select>
        </> : <select aria-label="LinkedIn embed height" className={selectClass} value={editor.getAttributes("linkedInEmbed").height} onChange={event => editor.chain().focus().updateAttributes("linkedInEmbed", { height: Number(event.target.value) }).run()}>{[450, 650, 850, 1000, 1200].map(height => <option key={height} value={height}>{height} px high</option>)}</select>}
        <Tool label="Edit selected media" onClick={() => openPanel(imageSelected ? "image" : "embed")}><Pencil size={15} /></Tool>
        <Tool label="Remove selected media" onClick={() => editor.chain().focus().deleteSelection().run()}><Trash2 size={15} /></Tool>
      </div>}
      <div className="max-h-[65vh] overflow-y-auto bg-slate-50 p-3 sm:p-6">
        <EditorContent editor={editor} className="mx-auto max-w-[800px] rounded-lg bg-white px-5 py-8 shadow-sm sm:px-10" />
      </div>
    </div>

    {preview && <div className="bg-slate-100 p-3 sm:p-6">
      <div className="mb-3 flex justify-center gap-2">
        <Tool label="Desktop preview" active={!mobile} onClick={() => setMobile(false)}><Monitor size={16} />Desktop</Tool>
        <Tool label="Mobile preview" active={mobile} onClick={() => setMobile(true)}><Smartphone size={16} />Mobile</Tool>
      </div>
      <div className={cn("mx-auto max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow", mobile ? "max-w-[390px]" : "max-w-[900px]")}>
        <div className="bg-emerald-950 px-6 py-8 text-center text-white"><span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{category}</span><h2 className="mt-3 text-2xl font-bold">{title || "Untitled article"}</h2></div>
        {banner && isArticleImageUrl(banner) && <img src={banner} alt={title || "Article banner"} className="max-h-[350px] w-full object-cover" />}
        <ArticleContent content={value} className="p-6 sm:p-10" />
      </div>
    </div>}
  </div>
}
