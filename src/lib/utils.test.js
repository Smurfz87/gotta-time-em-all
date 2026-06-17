import { describe, it, expect } from 'vitest'
import { getInitials } from './utils.js'

describe('getInitials', () => {
  it('returns single initial for a one-word name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('returns two initials for a two-word name', () => {
    expect(getInitials('Alice Bob')).toBe('AB')
  })

  it('returns only the first two initials for longer names', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB')
  })

  it('uppercases initials regardless of input case', () => {
    expect(getInitials('alice bob')).toBe('AB')
    expect(getInitials('ALICE BOB')).toBe('AB')
  })

  it('handles leading and trailing whitespace', () => {
    expect(getInitials('  Alice  ')).toBe('A')
    expect(getInitials('  Alice Bob  ')).toBe('AB')
  })

  it('handles multiple spaces between words', () => {
    expect(getInitials('Alice  Bob')).toBe('AB')
  })
})