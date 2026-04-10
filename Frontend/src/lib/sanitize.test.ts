import { describe, expect, it } from 'vitest'
import { sanitize } from './sanitize'

describe('sanitize', () => {
  it('removes script tags', () => {
    const dirty = '<div>safe</div><script>alert(1)</script>'
    expect(sanitize(dirty)).toBe('<div>safe</div>')
  })

  it('returns empty string for nullish values', () => {
    expect(sanitize(null)).toBe('')
    expect(sanitize(undefined)).toBe('')
  })
})
