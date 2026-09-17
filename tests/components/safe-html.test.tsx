import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { SafeHtml } from '@/components/ui/safe-html'

describe('<SafeHtml /> Component', () => {
  it('renders sanitized HTML safely', () => {
    render(<SafeHtml html="<p>Safe Lesson Content</p>" />)
    const el = screen.getByText('Safe Lesson Content')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('P')
  })

  it('neutralizes malicious scripts inside html prop', () => {
    const maliciousHtml = '<div>Valid Text<script>window.pwned = true;</script></div>'
    const { container } = render(<SafeHtml html={maliciousHtml} />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('Valid Text')
  })

  it('renders nothing when empty string is provided', () => {
    const { container } = render(<SafeHtml html="" />)
    expect(container.firstChild).toBeNull()
  })

  it('applies custom className and external link transformations', () => {
    const htmlWithLink = '<p>Check <a href="https://example.com">Resource</a></p>'
    const { container } = render(
      <SafeHtml html={htmlWithLink} className="custom-prose-class" externalLinks />
    )
    const wrapper = container.querySelector('.custom-prose-class')
    expect(wrapper).toBeInTheDocument()

    const link = container.querySelector('a')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
