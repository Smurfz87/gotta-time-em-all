import { describe, it, expect } from 'vitest'
import { computeElapsed, makeLap } from './timer.js'

describe('computeElapsed', () => {
  it('returns elapsed unchanged when startedAt is null (paused)', () => {
    expect(computeElapsed(5000, null, Date.now())).toBe(5000)
  })

  it('does not add epoch ms when startedAt is null', () => {
    // The bug: t - null = t (epoch ms, ~1.7 trillion). Guard must prevent this.
    const result = computeElapsed(1000, null, 1_700_000_000_000)
    expect(result).toBe(1000)
  })

  it('adds live duration when startedAt is set', () => {
    const startedAt = 1000
    const now = 6000
    expect(computeElapsed(0, startedAt, now)).toBe(5000)
  })

  it('adds live duration to accumulated elapsed', () => {
    expect(computeElapsed(3000, 1000, 4000)).toBe(6000)
  })

  it('returns elapsed unchanged when now equals startedAt', () => {
    expect(computeElapsed(2000, 5000, 5000)).toBe(2000)
  })
})

describe('makeLap', () => {
  it('first lap: gap equals cumulative', () => {
    const lap = makeLap([], 0, 1000, 6000)
    expect(lap.cumulative).toBe(5000)
    expect(lap.gap).toBe(5000)
  })

  it('second lap: gap is difference from previous cumulative', () => {
    const prev = { number: 1, cumulative: 5000, gap: 5000 }
    const lap = makeLap([prev], 5000, null, 8000)
    // startedAt null → cumulative = elapsed = 5000... wait that's wrong
    // Actually after stop, elapsed IS the cumulative. Let's use a running timer.
    const lap2 = makeLap([prev], 3000, 1000, 5000)
    // cumulative = computeElapsed(3000, 1000, 5000) = 3000 + 4000 = 7000
    // gap = 7000 - 5000 = 2000
    expect(lap2.cumulative).toBe(7000)
    expect(lap2.gap).toBe(2000)
  })

  it('lap numbers increment from existing laps', () => {
    const prev = { number: 1, cumulative: 3000, gap: 3000 }
    const lap = makeLap([prev], 3000, null, 0)
    expect(lap.number).toBe(2)
  })

  it('first lap number is 1', () => {
    const lap = makeLap([], 0, 1000, 2000)
    expect(lap.number).toBe(1)
  })

  it('works on a paused timer (startedAt null) using accumulated elapsed', () => {
    const lap = makeLap([], 8000, null, 9999999)
    expect(lap.cumulative).toBe(8000)
    expect(lap.gap).toBe(8000)
  })

  it('final-lap-on-stop: cumulative matches total elapsed', () => {
    // Simulate stopParticipant: elapsed is already accumulated, startedAt is null
    const elapsed = 12345
    const lap = makeLap([], elapsed, null, 0)
    expect(lap.cumulative).toBe(elapsed)
  })

  it('final-lap-on-stop: gap is correct when prior laps exist', () => {
    const prev = { number: 1, cumulative: 5000, gap: 5000 }
    const elapsed = 9000
    const lap = makeLap([prev], elapsed, null, 0)
    expect(lap.cumulative).toBe(9000)
    expect(lap.gap).toBe(4000)
  })
})
