import { describe, it, expect } from 'vitest'
import { formatElapsed } from './time.js'

describe('formatElapsed', () => {
  it('formats zero as 00:00.00', () => {
    expect(formatElapsed(0)).toBe('00:00.00')
  })

  it('formats sub-second values correctly', () => {
    expect(formatElapsed(500)).toBe('00:00.50')
    expect(formatElapsed(10)).toBe('00:00.01')
    expect(formatElapsed(990)).toBe('00:00.99')
  })

  it('formats whole seconds correctly', () => {
    expect(formatElapsed(1000)).toBe('00:01.00')
    expect(formatElapsed(5000)).toBe('00:05.00')
    expect(formatElapsed(59000)).toBe('00:59.00')
  })

  it('formats seconds with hundredths correctly', () => {
    expect(formatElapsed(1234)).toBe('00:01.23')
    expect(formatElapsed(9999)).toBe('00:09.99')
  })

  it('formats whole minutes correctly', () => {
    expect(formatElapsed(60000)).toBe('01:00.00')
    expect(formatElapsed(120000)).toBe('02:00.00')
  })

  it('formats minutes with seconds and hundredths', () => {
    expect(formatElapsed(61234)).toBe('01:01.23')
    expect(formatElapsed(90500)).toBe('01:30.50')
  })

  it('handles multi-hour values without capping minutes', () => {
    expect(formatElapsed(3661000)).toBe('61:01.00')
  })

  it('pads all fields to minimum width', () => {
    const result = formatElapsed(1010)
    expect(result).toMatch(/^\d{2}:\d{2}\.\d{2}$/)
  })
})