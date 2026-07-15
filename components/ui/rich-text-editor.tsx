"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
  List, ListOrdered, Link as LinkIcon, Sparkles, Quote, Trash2
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = "Start typing..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  })

  // Synchronize internal div content with the incoming value
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ""
      }
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true
      onChange(editorRef.current.innerHTML)
      isUpdatingRef.current = false
    }
  }

  const updateToolbarStates = () => {
    if (typeof document !== "undefined") {
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
      })
    }
  }

  const executeCommand = (command: string, value: string = "") => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value)
      handleInput()
      updateToolbarStates()
      // Refocus editor
      editorRef.current?.focus()
    }
  }

  const handleLink = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window !== "undefined") {
      const url = window.prompt("Enter link URL:", "https://")
      if (url) {
        executeCommand("createLink", url)
      }
    }
  }

  return (
    <div className="flex flex-col w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all duration-200">
      
      {/* Sleek Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-50 border-b border-gray-200 p-2 text-gray-700 select-none">
        
        {/* Basic formatting */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("bold"); }}
          className={`p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors ${activeStates.bold ? "bg-emerald-100 text-emerald-800 font-semibold" : ""}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("italic"); }}
          className={`p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors ${activeStates.italic ? "bg-emerald-100 text-emerald-800 font-semibold" : ""}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("underline"); }}
          className={`p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors ${activeStates.underline ? "bg-emerald-100 text-emerald-800 font-semibold" : ""}`}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("strikeThrough"); }}
          className={`p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors ${activeStates.strikeThrough ? "bg-emerald-100 text-emerald-800 font-semibold" : ""}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("formatBlock", "<h1>"); }}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("formatBlock", "<h2>"); }}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("formatBlock", "<blockquote>"); }}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("insertUnorderedList"); }}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("insertOrderedList"); }}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Link & Clear */}
        <button
          type="button"
          onMouseDown={handleLink}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); executeCommand("removeFormat"); }}
          className="p-2 rounded-lg hover:bg-gray-200 hover:text-gray-900 text-rose-600 transition-colors"
          title="Clear Formatting"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateToolbarStates}
        onMouseUp={updateToolbarStates}
        className="prose max-w-none focus:outline-none p-4 min-h-[320px] bg-white overflow-y-auto text-gray-800 leading-relaxed text-sm md:text-base border-t border-gray-100"
        style={{ outline: "none" }}
        data-placeholder={placeholder}
      />
      
      {/* Custom Styles for placeholder and tags in preview */}
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
        .prose h1 {
          font-size: 1.875rem; /* 30px */
          font-weight: 800;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .prose h2 {
          font-size: 1.5rem; /* 24px */
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .prose blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1rem;
          color: #4b5563;
          font-style: italic;
          margin: 1rem 0;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .prose a {
          color: #059669;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
