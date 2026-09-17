import { describe, it, expect } from 'vitest'
import { sanitizeHtml, stripTags, sanitizeHtmlWithLinks } from '@/lib/sanitize'

describe('HTML Sanitization (lib/sanitize.ts)', () => {
  describe('sanitizeHtml', () => {
    it('allows safe formatting tags and attributes', () => {
      const input = '<p>Hello <strong>World</strong>, check this <a href="https://example.com" class="link">link</a>.</p>'
      const output = sanitizeHtml(input)
      expect(output).toContain('<p>Hello <strong>World</strong>')
      expect(output).toContain('<a href="https://example.com" class="link">link</a>')
    })

    it('strips dangerous <script> tags and embedded scripts', () => {
      const input = '<p>Safe text</p><script>alert("XSS")</script>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('<script>')
      expect(output).not.toContain('alert')
      expect(output).toBe('<p>Safe text</p>')
    })

    it('strips inline JavaScript event handlers', () => {
      const input = '<img src="valid.jpg" onerror="alert(1)" onload="fetch(\'/api/steal\')" />'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('onerror')
      expect(output).not.toContain('onload')
      expect(output).not.toContain('alert')
      expect(output).toContain('<img src="valid.jpg">')
    })

    it('strips javascript: pseudo-protocol in links', () => {
      const input = '<a href="javascript:alert(\'pwned\')">Click me</a>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('javascript:')
      expect(output).not.toContain('alert')
    })

    it('handles empty strings and null gracefully', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as unknown as string)).toBe('')
    })
  })

  describe('stripTags', () => {
    it('removes all HTML tags and leaves pure plain text', () => {
      const input = '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>'
      const output = stripTags(input)
      expect(output).toBe('TitleThis is bold and italic.')
    })

    it('handles empty input', () => {
      expect(stripTags('')).toBe('')
    })
  })

  describe('sanitizeHtmlWithLinks', () => {
    it('adds target="_blank" and rel="noopener noreferrer" to external links', () => {
      const input = '<p>Visit <a href="https://cpace.ph">CPACE Website</a></p>'
      const output = sanitizeHtmlWithLinks(input)
      expect(output).toContain('target="_blank"')
      expect(output).toContain('rel="noopener noreferrer"')
      expect(output).toContain('href="https://cpace.ph"')
    })
  })
})
