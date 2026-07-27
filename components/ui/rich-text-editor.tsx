"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import UnderlineExt from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import LinkExt from "@tiptap/extension-link"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Minus, Undo, Redo,
  Heading1, Heading2, Heading3, Link2, Highlighter, Code2,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  minHeight?: string
}

// ── Toolbar Button ─────────────────────────────────────────────
function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-150 text-gray-500",
        active
          ? "bg-emerald-100 text-emerald-700 shadow-sm"
          : "hover:bg-gray-100 hover:text-gray-900",
        disabled && "opacity-30 cursor-not-allowed pointer-events-none"
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
}

// ── Main Editor ────────────────────────────────────────────────
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
  maxLength,
  minHeight = "280px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: "list-disc ml-5 space-y-1" } },
        orderedList: { HTMLAttributes: { class: "list-decimal ml-5 space-y-1" } },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-emerald-400 pl-4 italic text-gray-600 my-2 bg-emerald-50/50 py-1 rounded-r-lg",
          },
        },
        code: {
          HTMLAttributes: {
            class: "bg-gray-100 text-emerald-700 rounded px-1.5 py-0.5 font-mono text-[0.85em]",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-gray-900 text-emerald-300 rounded-xl p-4 font-mono text-sm overflow-x-auto my-3",
          },
        },
        heading: { levels: [1, 2, 3] },
        horizontalRule: { HTMLAttributes: { class: "border-gray-200 my-4" } },
      }),
      UnderlineExt,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-emerald-600 underline cursor-pointer hover:text-emerald-700",
        },
      }),
      CharacterCount.configure({ limit: maxLength }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none text-gray-800 leading-relaxed",
          "prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:my-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
          "prose-strong:text-gray-900 prose-em:text-gray-700",
        ),
      },
    },
    immediatelyRender: false,
  })

  // Sync external value changes (e.g. form reset, initial load)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("Enter URL:", previousUrl ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const charCount = editor.storage.characterCount?.characters?.() ?? 0

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm",
        "focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100",
        "transition-all duration-200",
        className
      )}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
        {/* History */}
        <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Headings */}
        <ToolbarBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Inline marks */}
        <ToolbarBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Alignment */}
        <ToolbarBtn title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Lists & Blocks */}
        <ToolbarBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Link */}
        <ToolbarBtn title="Insert / Edit Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* Character count */}
        <span className={cn(
          "ml-auto text-xs font-medium tabular-nums",
          maxLength && charCount > maxLength * 0.9 ? "text-amber-500" : "text-gray-400"
        )}>
          {charCount}{maxLength ? `/${maxLength}` : " chars"}
        </span>
      </div>

      {/* ── Editor Area ── */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="px-5 py-4 cursor-text"
      />

      {/* Placeholder style — TipTap injects a CSS class but we need to style it */}
      <style>{`
        .tiptap.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
