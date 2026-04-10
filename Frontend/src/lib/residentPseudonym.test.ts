import { describe, expect, it } from 'vitest'
import { pseudonymForResidentId } from './residentPseudonym'

describe('pseudonymForResidentId', () => {
  it('returns a stable pseudonym for the same id', () => {
    const first = pseudonymForResidentId(17)
    const second = pseudonymForResidentId(17)
    expect(first).toBe(second)
    expect(first.endsWith('-17')).toBe(true)
  })

  it('truncates decimal ids', () => {
    expect(pseudonymForResidentId(42.9).endsWith('-42')).toBe(true)
  })

  it('throws on invalid ids', () => {
    expect(() => pseudonymForResidentId(-1)).toThrow(RangeError)
    expect(() => pseudonymForResidentId(Number.NaN)).toThrow(RangeError)
  })
})
