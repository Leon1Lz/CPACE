import { Extension, Node, mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import { getLinkedInEmbedUrl, getYouTubeEmbedUrl } from "@/lib/article-html"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import { TextStyle, Color, FontSize, FontFamily } from "@tiptap/extension-text-style"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"
import {
  tableEditing,
  addColumnBefore,
  addColumnAfter,
  deleteColumn,
  addRowBefore,
  addRowAfter,
  deleteRow,
  deleteTable,
  toggleHeaderRow,
  toggleHeaderColumn,
  toggleHeaderCell,
  mergeCells,
  splitCell,
  goToNextCell,
} from "@tiptap/pm/tables"
import { keymap } from "@tiptap/pm/keymap"

declare module "@tiptap/core" {
  interface NodeConfig<Options = any, Storage = any> {
    tableRole?: "table" | "row" | "cell" | "header_cell"
  }
  interface Commands<ReturnType> {
    articleTable: {
      insertTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType
      addColumnBefore: () => ReturnType
      addColumnAfter: () => ReturnType
      deleteColumn: () => ReturnType
      addRowBefore: () => ReturnType
      addRowAfter: () => ReturnType
      deleteRow: () => ReturnType
      deleteTable: () => ReturnType
      toggleHeaderRow: () => ReturnType
      toggleHeaderColumn: () => ReturnType
      toggleHeaderCell: () => ReturnType
      mergeCells: () => ReturnType
      splitCell: () => ReturnType
    }
  }
}

export const ArticleImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      displayWidth: {
        default: "100%",
        parseHTML: element => element.style.width || "100%",
        renderHTML: attrs => ({ style: `width: ${attrs.displayWidth}` }),
      },
      imageAlign: {
        default: "center",
        parseHTML: element => element.style.marginLeft === "0px" ? "left" : element.style.marginRight === "0px" ? "right" : "center",
        renderHTML: attrs => ({ style: `margin-left: ${attrs.imageAlign === "left" ? "0" : "auto"}; margin-right: ${attrs.imageAlign === "right" ? "0" : "auto"}` }),
      },
    }
  },
}).configure({ allowBase64: true })

export const ArticleSpacing = Extension.create({
  name: "articleSpacing",
  addGlobalAttributes() {
    return [{
      types: ["paragraph", "heading"],
      attributes: {
        paragraphSpacing: {
          default: null,
          parseHTML: element => element.style.marginBottom || null,
          renderHTML: attrs => attrs.paragraphSpacing ? { style: `margin-bottom: ${attrs.paragraphSpacing}` } : {},
        },
        blockLineHeight: {
          default: null,
          parseHTML: element => element.style.lineHeight || null,
          renderHTML: attrs => attrs.blockLineHeight ? { style: `line-height: ${attrs.blockLineHeight}` } : {},
        },
      },
    }]
  },
})

export const LinkedInEmbed = Node.create({
  name: "linkedInEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      height: { default: 650, parseHTML: element => Number(element.getAttribute("height")) || 650 },
    }
  },
  parseHTML() {
    return [{ tag: "iframe", getAttrs: element => {
      const src = getLinkedInEmbedUrl(element.getAttribute("src") || "")
      return src ? { src } : false
    } }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(HTMLAttributes, { title: "LinkedIn post", width: 504 })]
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div")
      dom.className = "article-embed-placeholder"
      dom.contentEditable = "false"
      const label = document.createElement("strong")
      label.textContent = "LinkedIn post"
      const details = document.createElement("p")
      details.textContent = "Open Preview to view this embedded post. Select this block to change its height or remove it."
      const address = document.createElement("small")
      address.textContent = node.attrs.src
      dom.append(label, details, address)
      return { dom }
    }
  },
})

export const YouTubeEmbed = Node.create({
  name: "youTubeEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      height: { default: 420, parseHTML: element => Number(element.getAttribute("height")) || 420 },
    }
  },
  parseHTML() {
    return [{ tag: "iframe", getAttrs: element => {
      const src = getYouTubeEmbedUrl(element.getAttribute("src") || "")
      return src ? { src } : false
    } }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(HTMLAttributes, { title: "YouTube video", width: 720, allowfullscreen: "true" })]
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div")
      dom.className = "article-embed-placeholder"
      dom.contentEditable = "false"
      const label = document.createElement("strong")
      label.textContent = "YouTube video"
      const details = document.createElement("p")
      details.textContent = "Open Preview to watch this embedded video. Select this block to change its height or remove it."
      const address = document.createElement("small")
      address.textContent = node.attrs.src
      dom.append(label, details, address)
      return { dom }
    }
  },
})

export const ArticleTable = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  tableRole: "table",
  isolating: true,
  parseHTML() {
    return [{ tag: "table" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(HTMLAttributes), ["tbody", 0]]
  },
  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = true } = {}) =>
        ({ tr, dispatch, editor }) => {
          const { schema } = editor
          const cellType = schema.nodes.tableCell
          const headerType = schema.nodes.tableHeader
          const rowType = schema.nodes.tableRow
          const tableType = schema.nodes.table
          if (!cellType || !headerType || !rowType || !tableType) return false

          const rowNodes = []
          for (let r = 0; r < rows; r++) {
            const cells = []
            for (let c = 0; c < cols; c++) {
              const type = withHeaderRow && r === 0 ? headerType : cellType
              const cell = type.createAndFill()
              if (cell) cells.push(cell)
            }
            rowNodes.push(rowType.createChecked(null, cells))
          }
          const tableNode = tableType.createChecked(null, rowNodes)
          if (dispatch) {
            const offset = tr.selection.anchor + 1
            tr.replaceSelectionWith(tableNode)
            tr.scrollIntoView()
            const resolved = tr.doc.resolve(Math.min(offset, tr.doc.content.size))
            dispatch(tr)
            void resolved
          }
          return true
        },
      addColumnBefore: () => ({ state, dispatch }) => addColumnBefore(state, dispatch),
      addColumnAfter: () => ({ state, dispatch }) => addColumnAfter(state, dispatch),
      deleteColumn: () => ({ state, dispatch }) => deleteColumn(state, dispatch),
      addRowBefore: () => ({ state, dispatch }) => addRowBefore(state, dispatch),
      addRowAfter: () => ({ state, dispatch }) => addRowAfter(state, dispatch),
      deleteRow: () => ({ state, dispatch }) => deleteRow(state, dispatch),
      deleteTable: () => ({ state, dispatch }) => deleteTable(state, dispatch),
      toggleHeaderRow: () => ({ state, dispatch }) => toggleHeaderRow(state, dispatch),
      toggleHeaderColumn: () => ({ state, dispatch }) => toggleHeaderColumn(state, dispatch),
      toggleHeaderCell: () => ({ state, dispatch }) => toggleHeaderCell(state, dispatch),
      mergeCells: () => ({ state, dispatch }) => mergeCells(state, dispatch),
      splitCell: () => ({ state, dispatch }) => splitCell(state, dispatch),
    }
  },
  addProseMirrorPlugins() {
    return [
      keymap({
        Tab: goToNextCell(1),
        "Shift-Tab": goToNextCell(-1),
      }),
      tableEditing(),
    ]
  },
})

export const ArticleTableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  tableRole: "row",
  parseHTML() {
    return [{ tag: "tr" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0]
  },
})

function cellAttributes() {
  return {
    colspan: {
      default: 1,
      parseHTML: (element: HTMLElement) => Number(element.getAttribute("colspan")) || 1,
      renderHTML: (attrs: Record<string, any>) => (attrs.colspan > 1 ? { colspan: attrs.colspan } : {}),
    },
    rowspan: {
      default: 1,
      parseHTML: (element: HTMLElement) => Number(element.getAttribute("rowspan")) || 1,
      renderHTML: (attrs: Record<string, any>) => (attrs.rowspan > 1 ? { rowspan: attrs.rowspan } : {}),
    },
    colwidth: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const colwidth = element.getAttribute("colwidth")
        const value = colwidth ? colwidth.split(",").map(item => parseInt(item, 10)) : null
        return value && value.every(n => Number.isFinite(n)) ? value : null
      },
    },
    backgroundColor: {
      default: null,
      parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
      renderHTML: (attrs: Record<string, any>) =>
        attrs.backgroundColor ? { style: `background-color: ${attrs.backgroundColor}` } : {},
    },
  }
}

export const ArticleTableHeader = Node.create({
  name: "tableHeader",
  content: "block+",
  tableRole: "header_cell",
  isolating: true,
  addAttributes() {
    return cellAttributes()
  },
  parseHTML() {
    return [{ tag: "th" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0]
  },
})

export const ArticleTableCell = Node.create({
  name: "tableCell",
  content: "block+",
  tableRole: "cell",
  isolating: true,
  addAttributes() {
    return cellAttributes()
  },
  parseHTML() {
    return [{ tag: "td" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0]
  },
})

export function createArticleExtensions() {
  return [
    StarterKit.configure({ link: { openOnClick: false }, heading: { levels: [1, 2, 3, 4, 5, 6] } }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle, Color, FontSize, FontFamily,
    Highlight.configure({ multicolor: true }),
    ArticleSpacing, ArticleImageExtension, LinkedInEmbed, YouTubeEmbed,
    ArticleTable, ArticleTableRow, ArticleTableHeader, ArticleTableCell,
    CharacterCount,
    Placeholder.configure({ placeholder: "Write your article here…" }),
  ]
}
