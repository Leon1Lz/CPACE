import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Classname Merger (lib/utils.ts)', () => {
  it('combines basic class names properly', () => {
    expect(cn('px-4', 'py-2', 'text-white')).toBe('px-4 py-2 text-white')
  })

  it('handles conditional class names correctly', () => {
    const isActive = true
    const isDisabled = false
    expect(
      cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')
    ).toBe('btn btn-active')
  })

  it('resolves conflicting Tailwind classes with precedence to the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles array and object syntax gracefully', () => {
    expect(cn(['bg-emerald-500', 'rounded-xl'], { 'shadow-lg': true, 'hidden': false })).toBe(
      'bg-emerald-500 rounded-xl shadow-lg'
    )
  })
})
