import { computeElapsed, makeLap } from './timer.js'

export function defaultSession() {
  return {
    mode: 'heat',
    participants: [],
    archive: [],
    sessionArchiveStart: 0,
    lapState: null,
    intervalState: null,
    intervalConfig: { repCount: null, overflowBehavior: 'reset', overflowBuffer: 30000, paceGroups: [] },
    pendingHeats: []
  }
}

export function restoreSessionState(session) {
  if (session.lapState?.phase && session.lapState.phase !== 'idle') {
    return {
      heatPhase: session.lapState.phase,
      participantTimers: session.lapState.participants ?? {},
      intervalParticipants: {},
      intervalSessionStart: null
    }
  }
  if (session.intervalState?.phase === 'running') {
    return {
      heatPhase: 'running',
      participantTimers: {},
      intervalParticipants: session.intervalState.participants ?? {},
      intervalSessionStart: session.intervalState.sessionStart ?? null
    }
  }
  return { heatPhase: 'idle', participantTimers: {}, intervalParticipants: {}, intervalSessionStart: null }
}

export function buildStartTimers(mode, participants, intervalConfig, t) {
  if (mode === 'interval') {
    const intervalParticipants = {}
    for (const group of (intervalConfig?.paceGroups ?? [])) {
      for (const pId of (group.participantIds ?? [])) {
        intervalParticipants[pId] = { state: 'active', repStartedAt: t, reps: [], lastGroupCycle: 0, personalOverdueAt: null }
      }
    }
    return { participantTimers: {}, intervalParticipants, intervalSessionStart: t }
  }
  const timers = {}
  for (const p of participants) {
    timers[p.id] = mode === 'lap'
      ? { state: 'running', elapsed: 0, startedAt: t, laps: [] }
      : { state: 'running', elapsed: 0, startedAt: t }
  }
  return { participantTimers: timers, intervalParticipants: {}, intervalSessionStart: null }
}

export function applyStopParticipant(id, mode, participantTimers, t) {
  const timer = participantTimers[id]
  if (!timer || timer.state !== 'running') return
  timer.elapsed = computeElapsed(timer.elapsed, timer.startedAt, t)
  timer.startedAt = null
  if (mode === 'lap') timer.laps.push(makeLap(timer.laps, timer.elapsed, null, t))
  timer.state = 'stopped'
}

export function applyRecordLap(id, participantTimers, heatPhase, t) {
  const timer = participantTimers[id]
  if (!timer || timer.state !== 'running' || heatPhase !== 'running') return
  timer.laps.push(makeLap(timer.laps, timer.elapsed, timer.startedAt, t))
}

export function applyRecordIntervalRep(id, intervalParticipants, intervalSessionStart, intervalConfig, heatPhase, t) {
  const p = intervalParticipants[id]
  if (!p || (p.state !== 'active' && p.state !== 'overdue') || heatPhase !== 'running') return
  const wasOverdue = p.state === 'overdue'
  p.reps.push({ number: p.reps.length + 1, elapsed: t - p.repStartedAt })

  const maxReps = intervalConfig?.repCount ?? null
  if (maxReps !== null && p.reps.length >= maxReps) {
    p.state = 'done'
    return
  }

  const group = (intervalConfig?.paceGroups ?? []).find(g => (g.participantIds ?? []).includes(id))
  const sendOff = group?.sendOff ?? 60000

  if (wasOverdue) {
    const behavior = intervalConfig?.overflowBehavior ?? 'reset'
    const buffer = intervalConfig?.overflowBuffer ?? 0
    if (behavior === 'rejoin') {
      // Immediately active on the group clock — lastGroupCycle already at current cycle,
      // so the next cycle boundary will trigger overdue as normal
      p.state = 'active'
      p.repStartedAt = t
      p.personalOverdueAt = null
    } else if (behavior === 'reset+buffer') {
      // Immediately active on a personal clock with enlarged send-off
      p.state = 'active'
      p.repStartedAt = t
      p.personalOverdueAt = t + sendOff + buffer
    } else {
      // reset — immediately active, personal clock with original send-off
      p.state = 'active'
      p.repStartedAt = t
      p.personalOverdueAt = t + sendOff
    }
  } else {
    // On-time finish — rest until next group cycle
    p.state = 'resting'
    p.personalOverdueAt = null
    p.lastGroupCycle = Math.floor((t - (intervalSessionStart ?? t)) / sendOff)
  }
}

// Advance interval participant states as group cycles tick over.
// Mutates intervalParticipants in place — call inside untrack() to avoid reactive cycles.
export function advanceIntervalCycles(intervalParticipants, paceGroups, intervalSessionStart, t) {
  for (const group of paceGroups) {
    const sendOff = group.sendOff ?? 60000
    if (!intervalSessionStart) continue
    const currentCycle = Math.floor((t - intervalSessionStart) / sendOff)
    for (const pId of (group.participantIds ?? [])) {
      const p = intervalParticipants[pId]
      if (!p || p.state === 'done') continue
      if (p.personalOverdueAt !== null) {
        if (p.state === 'active' && t >= p.personalOverdueAt) {
          p.state = 'overdue'
          p.personalOverdueAt = null
        }
        continue
      }
      if (p.state === 'resting' && currentCycle > p.lastGroupCycle) {
        p.repStartedAt = intervalSessionStart + currentCycle * sendOff
        p.state = 'active'
        p.lastGroupCycle = currentCycle
      } else if (p.state === 'active' && currentCycle > p.lastGroupCycle) {
        p.state = 'overdue'
        p.lastGroupCycle = currentCycle
      } else if (p.state === 'overdue' && currentCycle > p.lastGroupCycle) {
        p.lastGroupCycle = currentCycle
      }
    }
  }
}

// Each builder accepts plain objects (caller snapshots reactive state before passing in)
// and returns an archive entry or null if there is nothing to commit.

export function buildHeatCommitEntry(participants, participantTimers, heatPhase, pendingHeats, archive, t) {
  const heats = [...pendingHeats]
  if (heatPhase !== 'idle') {
    const results = {}
    for (const p of participants) {
      const timer = participantTimers[p.id]
      if (!timer) { results[p.id] = null; continue }
      results[p.id] = timer.state === 'stopped'
        ? timer.elapsed
        : computeElapsed(timer.elapsed, timer.startedAt, t)
    }
    heats.push({ id: crypto.randomUUID(), number: heats.length + 1, timestamp: t, results })
  }
  if (heats.length === 0) return null
  return {
    id: crypto.randomUUID(),
    type: 'heat',
    number: archive.filter(e => e.type === 'heat').length + 1,
    timestamp: heats[heats.length - 1].timestamp,
    participants,
    heats
  }
}

export function buildIntervalCommitEntry(participants, intervalParticipants, intervalConfig, heatPhase, archive, t) {
  if (heatPhase === 'idle') return null
  const results = {}
  for (const p of participants) {
    results[p.id] = { reps: intervalParticipants[p.id]?.reps ?? [] }
  }
  return {
    id: crypto.randomUUID(),
    type: 'interval',
    number: archive.filter(e => e.type === 'interval').length + 1,
    timestamp: t,
    participants,
    paceGroups: intervalConfig?.paceGroups ?? [],
    overflowBehavior: intervalConfig?.overflowBehavior ?? 'reset',
    overflowBuffer: intervalConfig?.overflowBuffer ?? 0,
    repCount: intervalConfig?.repCount ?? null,
    results
  }
}

export function buildRunCommitEntry(participants, participantTimers, heatPhase, archive, t) {
  if (heatPhase === 'idle') return null
  const results = {}
  for (const p of participants) {
    const timer = participantTimers[p.id]
    if (!timer) { results[p.id] = { laps: [], elapsed: 0 }; continue }
    const elapsed = timer.state === 'stopped'
      ? timer.elapsed
      : computeElapsed(timer.elapsed, timer.startedAt, t)
    results[p.id] = { laps: timer.laps ?? [], elapsed }
  }
  return {
    id: crypto.randomUUID(),
    type: 'run',
    number: archive.filter(e => e.type === 'run').length + 1,
    timestamp: t,
    participants,
    results
  }
}
