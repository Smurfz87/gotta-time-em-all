import { describe, it, expect } from 'vitest'
import {
  defaultSession,
  restoreSessionState,
  buildStartTimers,
  applyStopParticipant,
  applyRecordLap,
  applyRecordIntervalRep,
  advanceIntervalCycles,
  buildHeatCommitEntry,
  buildIntervalCommitEntry,
  buildRunCommitEntry
} from './sessionLogic.js'

const alice = { id: 'a', name: 'Alice', initials: 'A' }
const bob   = { id: 'b', name: 'Bob',   initials: 'B' }
const group1 = { id: 'g1', name: 'Group 1', sendOff: 60000, participantIds: ['a'] }

// ─── defaultSession ───────────────────────────────────────────────────────────

describe('defaultSession', () => {
  it('returns heat mode with empty participants and archive', () => {
    const s = defaultSession()
    expect(s.mode).toBe('heat')
    expect(s.participants).toEqual([])
    expect(s.archive).toEqual([])
    expect(s.pendingHeats).toEqual([])
  })

  it('has default intervalConfig', () => {
    const s = defaultSession()
    expect(s.intervalConfig.overflowBehavior).toBe('reset')
    expect(s.intervalConfig.paceGroups).toEqual([])
    expect(s.intervalConfig.repCount).toBeNull()
  })
})

// ─── restoreSessionState ──────────────────────────────────────────────────────

describe('restoreSessionState', () => {
  it('returns idle state when no in-progress session', () => {
    const result = restoreSessionState(defaultSession())
    expect(result.heatPhase).toBe('idle')
    expect(result.participantTimers).toEqual({})
    expect(result.intervalParticipants).toEqual({})
    expect(result.intervalSessionStart).toBeNull()
  })

  it('restores a running lap session', () => {
    const participants = { a: { state: 'running', elapsed: 0, startedAt: 1000, laps: [] } }
    const session = { ...defaultSession(), lapState: { phase: 'running', participants } }
    const result = restoreSessionState(session)
    expect(result.heatPhase).toBe('running')
    expect(result.participantTimers).toBe(participants)
    expect(result.intervalParticipants).toEqual({})
  })

  it('restores a paused lap session', () => {
    const participants = { a: { state: 'running', elapsed: 5000, startedAt: null, laps: [] } }
    const session = { ...defaultSession(), lapState: { phase: 'paused', participants } }
    const result = restoreSessionState(session)
    expect(result.heatPhase).toBe('paused')
  })

  it('ignores lapState with idle phase', () => {
    const session = { ...defaultSession(), lapState: { phase: 'idle', participants: {} } }
    expect(restoreSessionState(session).heatPhase).toBe('idle')
  })

  it('restores a running interval session', () => {
    const iParticipants = { a: { state: 'active', repStartedAt: 1000, reps: [], lastGroupCycle: 0, personalOverdueAt: null } }
    const session = { ...defaultSession(), intervalState: { phase: 'running', sessionStart: 500, participants: iParticipants } }
    const result = restoreSessionState(session)
    expect(result.heatPhase).toBe('running')
    expect(result.intervalParticipants).toBe(iParticipants)
    expect(result.intervalSessionStart).toBe(500)
    expect(result.participantTimers).toEqual({})
  })
})

// ─── buildStartTimers ─────────────────────────────────────────────────────────

describe('buildStartTimers', () => {
  it('heat mode creates running timers for all participants', () => {
    const { participantTimers, intervalParticipants, intervalSessionStart } = buildStartTimers('heat', [alice, bob], null, 1000)
    expect(participantTimers.a).toEqual({ state: 'running', elapsed: 0, startedAt: 1000 })
    expect(participantTimers.b).toEqual({ state: 'running', elapsed: 0, startedAt: 1000 })
    expect(intervalParticipants).toEqual({})
    expect(intervalSessionStart).toBeNull()
  })

  it('lap mode creates timers with laps array', () => {
    const { participantTimers } = buildStartTimers('lap', [alice], null, 2000)
    expect(participantTimers.a).toEqual({ state: 'running', elapsed: 0, startedAt: 2000, laps: [] })
  })

  it('interval mode creates active participants per group', () => {
    const config = { paceGroups: [group1] }
    const { participantTimers, intervalParticipants, intervalSessionStart } = buildStartTimers('interval', [alice], config, 3000)
    expect(participantTimers).toEqual({})
    expect(intervalParticipants.a).toEqual({
      state: 'active', repStartedAt: 3000, reps: [], lastGroupCycle: 0, personalOverdueAt: null
    })
    expect(intervalSessionStart).toBe(3000)
  })

  it('interval mode with multiple groups initialises all participants', () => {
    const config = {
      paceGroups: [
        { id: 'g1', sendOff: 60000, participantIds: ['a'] },
        { id: 'g2', sendOff: 90000, participantIds: ['b'] }
      ]
    }
    const { intervalParticipants } = buildStartTimers('interval', [alice, bob], config, 0)
    expect(Object.keys(intervalParticipants)).toEqual(['a', 'b'])
  })
})

// ─── applyStopParticipant ─────────────────────────────────────────────────────

describe('applyStopParticipant', () => {
  it('accumulates elapsed and marks stopped', () => {
    const timers = { a: { state: 'running', elapsed: 1000, startedAt: 5000 } }
    applyStopParticipant('a', 'heat', timers, 7000)
    expect(timers.a.state).toBe('stopped')
    expect(timers.a.elapsed).toBe(3000)
    expect(timers.a.startedAt).toBeNull()
  })

  it('appends a final lap in lap mode', () => {
    const timers = { a: { state: 'running', elapsed: 0, startedAt: 1000, laps: [] } }
    applyStopParticipant('a', 'lap', timers, 6000)
    expect(timers.a.laps).toHaveLength(1)
    expect(timers.a.laps[0].cumulative).toBe(5000)
  })

  it('does not append a lap in heat mode', () => {
    const timers = { a: { state: 'running', elapsed: 0, startedAt: 0 } }
    applyStopParticipant('a', 'heat', timers, 5000)
    expect(timers.a.laps).toBeUndefined()
  })

  it('is a no-op if timer is already stopped', () => {
    const timers = { a: { state: 'stopped', elapsed: 5000, startedAt: null } }
    applyStopParticipant('a', 'heat', timers, 9000)
    expect(timers.a.elapsed).toBe(5000)
  })

  it('is a no-op for unknown id', () => {
    const timers = {}
    expect(() => applyStopParticipant('x', 'heat', timers, 0)).not.toThrow()
  })
})

// ─── applyRecordLap ───────────────────────────────────────────────────────────

describe('applyRecordLap', () => {
  it('appends a lap entry', () => {
    const timers = { a: { state: 'running', elapsed: 0, startedAt: 1000, laps: [] } }
    applyRecordLap('a', timers, 'running', 6000)
    expect(timers.a.laps).toHaveLength(1)
    expect(timers.a.laps[0].number).toBe(1)
    expect(timers.a.laps[0].cumulative).toBe(5000)
  })

  it('is a no-op when heatPhase is not running', () => {
    const timers = { a: { state: 'running', elapsed: 0, startedAt: 0, laps: [] } }
    applyRecordLap('a', timers, 'paused', 5000)
    expect(timers.a.laps).toHaveLength(0)
  })

  it('is a no-op when timer is stopped', () => {
    const timers = { a: { state: 'stopped', elapsed: 5000, startedAt: null, laps: [] } }
    applyRecordLap('a', timers, 'running', 8000)
    expect(timers.a.laps).toHaveLength(0)
  })
})

// ─── applyRecordIntervalRep ───────────────────────────────────────────────────

function makeParticipant(overrides = {}) {
  return { state: 'active', repStartedAt: 0, reps: [], lastGroupCycle: 0, personalOverdueAt: null, ...overrides }
}

function makeConfig(overrides = {}) {
  return {
    repCount: null,
    overflowBehavior: 'reset',
    overflowBuffer: 0,
    paceGroups: [{ id: 'g1', sendOff: 60000, participantIds: ['a'] }],
    ...overrides
  }
}

describe('applyRecordIntervalRep — on-time finish', () => {
  it('records a rep and sets state to resting', () => {
    const participants = { a: makeParticipant({ repStartedAt: 0 }) }
    applyRecordIntervalRep('a', participants, 0, makeConfig(), 'running', 45000)
    expect(participants.a.reps).toHaveLength(1)
    expect(participants.a.reps[0].elapsed).toBe(45000)
    expect(participants.a.state).toBe('resting')
  })

  it('sets personalOverdueAt to null on resting', () => {
    const participants = { a: makeParticipant() }
    applyRecordIntervalRep('a', participants, 0, makeConfig(), 'running', 45000)
    expect(participants.a.personalOverdueAt).toBeNull()
  })

  it('syncs lastGroupCycle on resting', () => {
    const sessionStart = 0
    const sendOff = 60000
    const t = 130000 // cycle 2
    const participants = { a: makeParticipant({ repStartedAt: sessionStart + 2 * sendOff }) }
    const config = makeConfig({ paceGroups: [{ id: 'g1', sendOff, participantIds: ['a'] }] })
    applyRecordIntervalRep('a', participants, sessionStart, config, 'running', t)
    expect(participants.a.lastGroupCycle).toBe(2)
  })
})

describe('applyRecordIntervalRep — rep count ceiling', () => {
  it('transitions to done when max reps reached', () => {
    const participants = { a: makeParticipant({ reps: [{ number: 1, elapsed: 50000 }] }) }
    applyRecordIntervalRep('a', participants, 0, makeConfig({ repCount: 2 }), 'running', 110000)
    expect(participants.a.state).toBe('done')
    expect(participants.a.reps).toHaveLength(2)
  })

  it('does not go to done when under the ceiling', () => {
    const participants = { a: makeParticipant() }
    applyRecordIntervalRep('a', participants, 0, makeConfig({ repCount: 3 }), 'running', 45000)
    expect(participants.a.state).not.toBe('done')
  })
})

describe('applyRecordIntervalRep — overflow: reset', () => {
  it('goes immediately active with personalOverdueAt = t + sendOff', () => {
    const t = 75000
    const sendOff = 60000
    const participants = { a: makeParticipant({ state: 'overdue', repStartedAt: 0 }) }
    const config = makeConfig({ overflowBehavior: 'reset', paceGroups: [{ id: 'g1', sendOff, participantIds: ['a'] }] })
    applyRecordIntervalRep('a', participants, 0, config, 'running', t)
    expect(participants.a.state).toBe('active')
    expect(participants.a.repStartedAt).toBe(t)
    expect(participants.a.personalOverdueAt).toBe(t + sendOff)
  })
})

describe('applyRecordIntervalRep — overflow: reset+buffer', () => {
  it('sets personalOverdueAt = t + sendOff + buffer', () => {
    const t = 75000
    const sendOff = 60000
    const buffer = 15000
    const participants = { a: makeParticipant({ state: 'overdue', repStartedAt: 0 }) }
    const config = makeConfig({
      overflowBehavior: 'reset+buffer',
      overflowBuffer: buffer,
      paceGroups: [{ id: 'g1', sendOff, participantIds: ['a'] }]
    })
    applyRecordIntervalRep('a', participants, 0, config, 'running', t)
    expect(participants.a.state).toBe('active')
    expect(participants.a.personalOverdueAt).toBe(t + sendOff + buffer)
  })
})

describe('applyRecordIntervalRep — overflow: rejoin', () => {
  it('goes immediately active with personalOverdueAt null (group clock)', () => {
    const t = 75000
    const participants = { a: makeParticipant({ state: 'overdue', repStartedAt: 0 }) }
    const config = makeConfig({ overflowBehavior: 'rejoin' })
    applyRecordIntervalRep('a', participants, 0, config, 'running', t)
    expect(participants.a.state).toBe('active')
    expect(participants.a.repStartedAt).toBe(t)
    expect(participants.a.personalOverdueAt).toBeNull()
  })
})

describe('applyRecordIntervalRep — guard conditions', () => {
  it('is a no-op when heatPhase is not running', () => {
    const participants = { a: makeParticipant() }
    applyRecordIntervalRep('a', participants, 0, makeConfig(), 'idle', 45000)
    expect(participants.a.reps).toHaveLength(0)
  })

  it('is a no-op for resting participant', () => {
    const participants = { a: makeParticipant({ state: 'resting' }) }
    applyRecordIntervalRep('a', participants, 0, makeConfig(), 'running', 45000)
    expect(participants.a.reps).toHaveLength(0)
  })

  it('is a no-op for done participant', () => {
    const participants = { a: makeParticipant({ state: 'done' }) }
    applyRecordIntervalRep('a', participants, 0, makeConfig(), 'running', 45000)
    expect(participants.a.reps).toHaveLength(0)
  })
})

// ─── advanceIntervalCycles ────────────────────────────────────────────────────

describe('advanceIntervalCycles', () => {
  const groups = [{ id: 'g1', sendOff: 60000, participantIds: ['a'] }]
  const sessionStart = 1000

  it('transitions active → overdue when cycle advances', () => {
    const participants = { a: makeParticipant({ state: 'active', lastGroupCycle: 0 }) }
    advanceIntervalCycles(participants, groups, sessionStart, sessionStart + 65000)
    expect(participants.a.state).toBe('overdue')
  })

  it('transitions resting → active when cycle advances', () => {
    const participants = { a: makeParticipant({ state: 'resting', lastGroupCycle: 0 }) }
    advanceIntervalCycles(participants, groups, sessionStart, sessionStart + 65000)
    expect(participants.a.state).toBe('active')
    expect(participants.a.repStartedAt).toBe(sessionStart + 60000)
  })

  it('does not advance when still in same cycle', () => {
    const participants = { a: makeParticipant({ state: 'active', lastGroupCycle: 0 }) }
    advanceIntervalCycles(participants, groups, sessionStart, sessionStart + 50000)
    expect(participants.a.state).toBe('active')
  })

  it('fires overdue on personalOverdueAt personal clock', () => {
    const overdueAt = sessionStart + 70000
    const participants = { a: makeParticipant({ state: 'active', personalOverdueAt: overdueAt }) }
    advanceIntervalCycles(participants, groups, sessionStart, overdueAt + 5000)
    expect(participants.a.state).toBe('overdue')
    expect(participants.a.personalOverdueAt).toBeNull()
  })

  it('does not fire overdue when personal clock has not expired', () => {
    const overdueAt = sessionStart + 70000
    const participants = { a: makeParticipant({ state: 'active', personalOverdueAt: overdueAt }) }
    advanceIntervalCycles(participants, groups, sessionStart, overdueAt - 5000)
    expect(participants.a.state).toBe('active')
  })

  it('skips done participants', () => {
    const participants = { a: makeParticipant({ state: 'done', lastGroupCycle: 0 }) }
    advanceIntervalCycles(participants, groups, sessionStart, sessionStart + 65000)
    expect(participants.a.state).toBe('done')
  })
})

// ─── buildHeatCommitEntry ─────────────────────────────────────────────────────

describe('buildHeatCommitEntry', () => {
  it('returns null when idle with no pending heats', () => {
    expect(buildHeatCommitEntry([], {}, 'idle', [], [], 0)).toBeNull()
  })

  it('builds an entry from pending heats only (idle phase)', () => {
    const pending = [{ id: 'h1', number: 1, timestamp: 1000, results: { a: 5000 } }]
    const entry = buildHeatCommitEntry([alice], {}, 'idle', pending, [], 2000)
    expect(entry.type).toBe('heat')
    expect(entry.heats).toHaveLength(1)
    expect(entry.number).toBe(1)
  })

  it('includes in-flight heat when running', () => {
    const timers = { a: { state: 'running', elapsed: 0, startedAt: 1000 } }
    const entry = buildHeatCommitEntry([alice], timers, 'running', [], [], 6000)
    expect(entry.heats).toHaveLength(1)
    expect(entry.heats[0].results.a).toBe(5000)
  })

  it('includes stopped timer elapsed directly', () => {
    const timers = { a: { state: 'stopped', elapsed: 4200, startedAt: null } }
    const entry = buildHeatCommitEntry([alice], timers, 'running', [], [], 9000)
    expect(entry.heats[0].results.a).toBe(4200)
  })

  it('increments number based on existing heat entries in archive', () => {
    const archive = [{ type: 'heat' }, { type: 'heat' }, { type: 'run' }]
    const timers = { a: { state: 'stopped', elapsed: 3000, startedAt: null } }
    const entry = buildHeatCommitEntry([alice], timers, 'running', [], archive, 0)
    expect(entry.number).toBe(3)
  })
})

// ─── buildIntervalCommitEntry ─────────────────────────────────────────────────

describe('buildIntervalCommitEntry', () => {
  it('returns null when idle', () => {
    expect(buildIntervalCommitEntry([], {}, {}, 'idle', [], 0)).toBeNull()
  })

  it('builds entry with rep results', () => {
    const reps = [{ number: 1, elapsed: 55000 }]
    const iParticipants = { a: { reps } }
    const config = { paceGroups: [group1], overflowBehavior: 'reset', overflowBuffer: 0, repCount: 3 }
    const entry = buildIntervalCommitEntry([alice], iParticipants, config, 'running', [], 0)
    expect(entry.type).toBe('interval')
    expect(entry.results.a.reps).toEqual(reps)
    expect(entry.repCount).toBe(3)
    expect(entry.paceGroups).toEqual([group1])
  })

  it('handles participant with no reps', () => {
    const entry = buildIntervalCommitEntry([alice], {}, makeConfig(), 'running', [], 0)
    expect(entry.results.a.reps).toEqual([])
  })
})

// ─── buildRunCommitEntry ──────────────────────────────────────────────────────

describe('buildRunCommitEntry', () => {
  it('returns null when idle', () => {
    expect(buildRunCommitEntry([], {}, 'idle', [], 0)).toBeNull()
  })

  it('builds entry with lap results', () => {
    const laps = [{ number: 1, gap: 5000, cumulative: 5000 }]
    const timers = { a: { state: 'stopped', elapsed: 5000, startedAt: null, laps } }
    const entry = buildRunCommitEntry([alice], timers, 'running', [], 0)
    expect(entry.type).toBe('run')
    expect(entry.results.a.laps).toEqual(laps)
    expect(entry.results.a.elapsed).toBe(5000)
  })

  it('computes elapsed for still-running timer', () => {
    const timers = { a: { state: 'running', elapsed: 1000, startedAt: 4000, laps: [] } }
    const entry = buildRunCommitEntry([alice], timers, 'running', [], 6000)
    expect(entry.results.a.elapsed).toBe(3000)
  })

  it('handles participant with no timer', () => {
    const entry = buildRunCommitEntry([alice], {}, 'running', [], 0)
    expect(entry.results.a).toEqual({ laps: [], elapsed: 0 })
  })
})