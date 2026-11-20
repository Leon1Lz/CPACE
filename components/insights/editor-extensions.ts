import { Extension, Node, mergeAttributes } from "@tiptap/core"
import Image from "@tiptap/extension-image"
import { getLinkedInEmbedUrl } from "@/lib/article-html"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"

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

export function createArticleExtensions() {
  return [
    StarterKit.configure({ link: { openOnClick: false }, heading: { levels: [1, 2, 3, 4, 5, 6] } }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle, Color, FontSize,
    Highlight.configure({ multicolor: true }),
    ArticleSpacing, ArticleImageExtension, LinkedInEmbed, CharacterCount,
    Placeholder.configure({ placeholder: "Write your article here…" }),
  ]
}
