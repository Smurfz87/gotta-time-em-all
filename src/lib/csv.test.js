import { describe, it, expect } from 'vitest'
import { buildHeatCsv, buildRunCsv, buildIntervalCsv } from './csv.js'

const alice = { id: 'a', name: 'Alice' }
const bob   = { id: 'b', name: 'Bob' }

describe('buildHeatCsv', () => {
  it('produces correct header with one heat', () => {
    const entry = {
      participants: [alice],
      heats: [{ id: 'h1', number: 1, results: { a: 5000 } }]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[0]).toBe('Participant,Heat 1,Best')
  })

  it('produces correct header with multiple heats', () => {
    const entry = {
      participants: [alice],
      heats: [
        { id: 'h1', number: 1, results: { a: 5000 } },
        { id: 'h2', number: 2, results: { a: 4800 } }
      ]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[0]).toBe('Participant,Heat 1,Heat 2,Best')
  })

  it('formats participant times correctly', () => {
    const entry = {
      participants: [alice],
      heats: [{ id: 'h1', number: 1, results: { a: 5000 } }]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[1]).toBe('Alice,00:05.00,00:05.00')
  })

  it('shows DNF for missing result in a heat', () => {
    const entry = {
      participants: [alice],
      heats: [{ id: 'h1', number: 1, results: {} }]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[1]).toBe('Alice,DNF,DNF')
  })

  it('shows DNF in Best column when all heats are DNF', () => {
    const entry = {
      participants: [alice],
      heats: [
        { id: 'h1', number: 1, results: {} },
        { id: 'h2', number: 2, results: {} }
      ]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[1]).toMatch(/DNF$/)
  })

  it('selects the fastest heat as Best', () => {
    const entry = {
      participants: [alice],
      heats: [
        { id: 'h1', number: 1, results: { a: 6000 } },
        { id: 'h2', number: 2, results: { a: 4500 } }
      ]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[1]).toBe('Alice,00:06.00,00:04.50,00:04.50')
  })

  it('sorts participants fastest-first', () => {
    const entry = {
      participants: [bob, alice],
      heats: [{ id: 'h1', number: 1, results: { a: 4000, b: 6000 } }]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[1]).toMatch(/^Alice/)
    expect(lines[2]).toMatch(/^Bob/)
  })

  it('sorts DNF participants after timed participants', () => {
    const entry = {
      participants: [alice, bob],
      heats: [{ id: 'h1', number: 1, results: { a: null, b: 5000 } }]
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[1]).toMatch(/^Bob/)
    expect(lines[2]).toMatch(/^Alice/)
  })

  it('supports legacy single-heat format without heats array', () => {
    const entry = {
      id: 'h1',
      participants: [alice],
      results: { a: 5000 }
    }
    const lines = buildHeatCsv(entry).split('\n')
    expect(lines[0]).toBe('Participant,Heat 1,Best')
    expect(lines[1]).toBe('Alice,00:05.00,00:05.00')
  })
})

describe('buildRunCsv', () => {
  it('produces correct header', () => {
    const entry = { participants: [], results: {} }
    expect(buildRunCsv(entry)).toBe('Participant,Lap,Gap,Cumulative')
  })

  it('produces one row per lap plus a Total row', () => {
    const entry = {
      participants: [alice],
      results: {
        a: {
          elapsed: 10000,
          laps: [
            { number: 1, gap: 5000, cumulative: 5000 },
            { number: 2, gap: 5000, cumulative: 10000 }
          ]
        }
      }
    }
    const lines = buildRunCsv(entry).split('\n')
    expect(lines).toHaveLength(4) // header + 2 laps + total
    expect(lines[1]).toBe('Alice,1,00:05.00,00:05.00')
    expect(lines[2]).toBe('Alice,2,00:05.00,00:10.00')
    expect(lines[3]).toBe('Alice,Total,,00:10.00')
  })

  it('skips participants with no result', () => {
    const entry = {
      participants: [alice, bob],
      results: {
        a: { elapsed: 5000, laps: [{ number: 1, gap: 5000, cumulative: 5000 }] }
      }
    }
    const lines = buildRunCsv(entry).split('\n')
    expect(lines.every(l => !l.startsWith('Bob'))).toBe(true)
  })

  it('handles participant with no laps (only Total row)', () => {
    const entry = {
      participants: [alice],
      results: { a: { elapsed: 5000, laps: [] } }
    }
    const lines = buildRunCsv(entry).split('\n')
    expect(lines).toHaveLength(2) // header + total
    expect(lines[1]).toBe('Alice,Total,,00:05.00')
  })
})

describe('buildIntervalCsv', () => {
  const g1 = { id: 'g1', name: 'Group 1', sendOff: 90000, participantIds: ['a'] }
  const g2 = { id: 'g2', name: 'Group 2', sendOff: 60000, participantIds: ['b'] }

  it('produces correct header', () => {
    const entry = { participants: [], paceGroups: [], results: {} }
    expect(buildIntervalCsv(entry)).toBe('Group,Participant,Rep,Time,Status')
  })

  it('marks rep OK when elapsed within send-off', () => {
    const entry = {
      participants: [alice],
      paceGroups: [g1],
      results: { a: { reps: [{ number: 1, elapsed: 85000 }] } }
    }
    const lines = buildIntervalCsv(entry).split('\n')
    expect(lines[1]).toMatch(/,OK$/)
  })

  it('marks rep Overdue when elapsed exceeds send-off', () => {
    const entry = {
      participants: [alice],
      paceGroups: [g1],
      results: { a: { reps: [{ number: 1, elapsed: 95000 }] } }
    }
    const lines = buildIntervalCsv(entry).split('\n')
    expect(lines[1]).toMatch(/,Overdue$/)
  })

  it('produces one row per rep across groups', () => {
    const entry = {
      participants: [alice, bob],
      paceGroups: [g1, g2],
      results: {
        a: { reps: [{ number: 1, elapsed: 85000 }, { number: 2, elapsed: 88000 }] },
        b: { reps: [{ number: 1, elapsed: 55000 }] }
      }
    }
    const lines = buildIntervalCsv(entry).split('\n')
    expect(lines).toHaveLength(4) // header + 2 alice reps + 1 bob rep
    expect(lines[1]).toMatch(/^Group 1,Alice,1,/)
    expect(lines[2]).toMatch(/^Group 1,Alice,2,/)
    expect(lines[3]).toMatch(/^Group 2,Bob,1,/)
  })

  it('skips participants not in results', () => {
    const entry = {
      participants: [alice],
      paceGroups: [g1],
      results: {}
    }
    const lines = buildIntervalCsv(entry).split('\n')
    expect(lines).toHaveLength(1) // header only
  })
})