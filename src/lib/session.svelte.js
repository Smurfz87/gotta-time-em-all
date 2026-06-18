import { untrack } from 'svelte'
import { readSession, writeSession } from './storage.js'
import { getInitials } from './utils.js'
import { computeElapsed, makeLap } from './timer.js'

export function createSession() {
  function defaultSession() {
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

  let session = $state({ ...defaultSession(), ...readSession() })
  let heatPhase = $state('idle')
  let participantTimers = $state({})
  let intervalParticipants = $state({})
  let intervalSessionStart = $state(null)
  let now = $state(Date.now())

  // Restore in-progress session on page reload — timestamps are wall-clock epoch
  // values so elapsed time continues accumulating correctly without any adjustment
  if (session.lapState?.phase && session.lapState.phase !== 'idle') {
    heatPhase = session.lapState.phase
    participantTimers = session.lapState.participants ?? {}
  } else if (session.intervalState?.phase === 'running') {
    heatPhase = 'running'
    intervalParticipants = session.intervalState.participants ?? {}
    intervalSessionStart = session.intervalState.sessionStart ?? null
  }

  let allStopped = $derived(
    session.mode !== 'interval' &&
    heatPhase !== 'idle' &&
    session.participants.length > 0 &&
    session.participants.every(p => participantTimers[p.id]?.state === 'stopped')
  )

  let allIntervalDone = $derived(
    session.mode === 'interval' &&
    heatPhase === 'running' &&
    session.participants.length > 0 &&
    session.participants.every(p => intervalParticipants[p.id]?.state === 'done')
  )

  let heatHistory = $derived(session.pendingHeats)

  let canStart = $derived(
    session.mode === 'interval'
      ? session.participants.length > 0 &&
        session.intervalConfig.paceGroups.length > 0 &&
        session.participants.every(p =>
          session.intervalConfig.paceGroups.some(g => g.participantIds.includes(p.id))
        )
      : session.participants.length > 0
  )

  let atLeastOneStopped = $derived(
    session.mode !== 'interval' &&
    heatPhase !== 'idle' &&
    session.participants.some(p => participantTimers[p.id]?.state === 'stopped')
  )

  $effect(() => {
    if (heatPhase !== 'running' || allStopped || allIntervalDone) return
    const id = setInterval(() => { now = Date.now() }, 50)
    return () => clearInterval(id)
  })

  // Advance interval participants between states as group cycles tick over.
  // Reads `now` (tracked) but mutates `intervalParticipants` (untracked) to avoid a
  // reactive cycle — mutations flow to session.intervalState via the shared reference.
  //
  // Participants on a personal clock (reset/reset+buffer overflow) have personalOverdueAt
  // set and are handled independently of the group cycle.
  $effect(() => {
    if (session.mode !== 'interval' || heatPhase !== 'running') return
    const t = now
    untrack(() => {
      const groups = session.intervalConfig?.paceGroups ?? []
      for (const group of groups) {
        const sendOff = group.sendOff ?? 60000
        const sessionStart = intervalSessionStart
        if (!sessionStart) continue
        const currentCycle = Math.floor((t - sessionStart) / sendOff)
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
            p.repStartedAt = sessionStart + currentCycle * sendOff
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
    })
  })

  $effect(() => {
    writeSession($state.snapshot(session))
  })

  function commitCurrentState() {
    const t = Date.now()
    if (session.mode === 'heat') {
      const heats = [...session.pendingHeats]
      if (heatPhase !== 'idle') {
        const results = {}
        for (const p of session.participants) {
          const timer = participantTimers[p.id]
          if (!timer) { results[p.id] = null; continue }
          results[p.id] = timer.state === 'stopped'
            ? timer.elapsed
            : computeElapsed(timer.elapsed, timer.startedAt, t)
        }
        heats.push({ id: crypto.randomUUID(), number: heats.length + 1, timestamp: t, results })
      }
      if (heats.length === 0) return
      session.archive.push({
        id: crypto.randomUUID(),
        type: 'heat',
        number: session.archive.filter(e => e.type === 'heat').length + 1,
        timestamp: heats[heats.length - 1].timestamp,
        participants: $state.snapshot(session.participants),
        heats
      })
    } else if (session.mode === 'interval') {
      if (heatPhase === 'idle') return
      const results = {}
      for (const p of session.participants) {
        const itimer = intervalParticipants[p.id]
        results[p.id] = { reps: $state.snapshot(itimer?.reps ?? []) }
      }
      session.archive.push({
        id: crypto.randomUUID(),
        type: 'interval',
        number: session.archive.filter(e => e.type === 'interval').length + 1,
        timestamp: t,
        participants: $state.snapshot(session.participants),
        paceGroups: $state.snapshot(session.intervalConfig?.paceGroups ?? []),
        overflowBehavior: session.intervalConfig?.overflowBehavior ?? 'reset',
        overflowBuffer: session.intervalConfig?.overflowBuffer ?? 0,
        repCount: session.intervalConfig?.repCount ?? null,
        results
      })
    } else {
      if (heatPhase === 'idle') return
      const results = {}
      for (const p of session.participants) {
        const timer = participantTimers[p.id]
        if (!timer) { results[p.id] = { laps: [], elapsed: 0 }; continue }
        const elapsed = timer.state === 'stopped'
          ? timer.elapsed
          : computeElapsed(timer.elapsed, timer.startedAt, t)
        results[p.id] = { laps: $state.snapshot(timer.laps ?? []), elapsed }
      }
      session.archive.push({
        id: crypto.randomUUID(),
        type: 'run',
        number: session.archive.filter(e => e.type === 'run').length + 1,
        timestamp: t,
        participants: $state.snapshot(session.participants),
        results
      })
    }
  }

  function resetHeat() {
    heatPhase = 'idle'
    participantTimers = {}
    intervalParticipants = {}
    intervalSessionStart = null
    if (session.mode === 'lap') session.lapState = null
    if (session.mode === 'interval') session.intervalState = null
  }

  function setMode(m) {
    if (m === session.mode) return
    if (heatPhase !== 'idle' || session.pendingHeats.length > 0) {
      const name = m === 'heat' ? 'Heat' : m === 'lap' ? 'Lap' : 'Interval'
      if (!confirm(`Switch to ${name} mode? The current session will be saved and reset.`)) return
      commitCurrentState()
    }
    session.pendingHeats = []
    session.mode = m
    session.sessionArchiveStart = session.archive.length
    resetHeat()
  }

  function addParticipant(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    session.participants.push({
      id: crypto.randomUUID(),
      name: trimmed,
      initials: getInitials(trimmed)
    })
  }

  function removeParticipant(id) {
    if (heatPhase !== 'idle') return
    session.participants = session.participants.filter(p => p.id !== id)
    delete participantTimers[id]
    for (const group of session.intervalConfig?.paceGroups ?? []) {
      group.participantIds = group.participantIds.filter(pId => pId !== id)
    }
  }

  function startAll() {
    const t = Date.now()
    if (session.mode === 'interval') {
      const participants = {}
      for (const group of (session.intervalConfig?.paceGroups ?? [])) {
        for (const pId of (group.participantIds ?? [])) {
          participants[pId] = { state: 'active', repStartedAt: t, reps: [], lastGroupCycle: 0, personalOverdueAt: null }
        }
      }
      session.intervalState = { phase: 'running', sessionStart: t, participants }
      intervalParticipants = session.intervalState.participants
      intervalSessionStart = t
    } else if (session.mode === 'lap') {
      const participants = {}
      for (const p of session.participants) {
        participants[p.id] = { state: 'running', elapsed: 0, startedAt: t, laps: [] }
      }
      session.lapState = { phase: 'running', participants }
      participantTimers = session.lapState.participants
    } else {
      const timers = {}
      for (const p of session.participants) {
        timers[p.id] = { state: 'running', elapsed: 0, startedAt: t }
      }
      participantTimers = timers
    }
    heatPhase = 'running'
    now = t
  }

  function stopParticipant(id) {
    const timer = participantTimers[id]
    if (!timer || timer.state !== 'running') return
    const t = Date.now()
    timer.elapsed = computeElapsed(timer.elapsed, timer.startedAt, t)
    timer.startedAt = null
    if (session.mode === 'lap') {
      timer.laps.push(makeLap(timer.laps, timer.elapsed, null, t))
    }
    timer.state = 'stopped'
  }

  function recordLap(id) {
    const timer = participantTimers[id]
    if (!timer || timer.state !== 'running' || heatPhase !== 'running') return
    const t = Date.now()
    timer.laps.push(makeLap(timer.laps, timer.elapsed, timer.startedAt, t))
  }

  function recordIntervalRep(id) {
    const p = intervalParticipants[id]
    if (!p || (p.state !== 'active' && p.state !== 'overdue') || heatPhase !== 'running') return
    const t = Date.now()
    const wasOverdue = p.state === 'overdue'
    p.reps.push({ number: p.reps.length + 1, elapsed: t - p.repStartedAt })

    const maxReps = session.intervalConfig?.repCount ?? null
    if (maxReps !== null && p.reps.length >= maxReps) {
      p.state = 'done'
      return
    }

    const group = (session.intervalConfig?.paceGroups ?? []).find(g => (g.participantIds ?? []).includes(id))
    const sendOff = group?.sendOff ?? 60000

    if (wasOverdue) {
      const behavior = session.intervalConfig?.overflowBehavior ?? 'reset'
      const buffer = session.intervalConfig?.overflowBuffer ?? 0
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

  function pauseAll() {
    const t = Date.now()
    for (const id in participantTimers) {
      const timer = participantTimers[id]
      if (timer.state === 'running') {
        timer.elapsed = computeElapsed(timer.elapsed, timer.startedAt, t)
        timer.startedAt = null
      }
    }
    if (session.mode === 'lap' && session.lapState) session.lapState.phase = 'paused'
    heatPhase = 'paused'
  }

  function resumeAll() {
    const t = Date.now()
    for (const id in participantTimers) {
      const timer = participantTimers[id]
      if (timer.state === 'running') timer.startedAt = t
    }
    if (session.mode === 'lap' && session.lapState) session.lapState.phase = 'running'
    now = t
    heatPhase = 'running'
  }

  function newHeat() {
    const t = Date.now()
    const results = {}
    for (const p of session.participants) {
      const timer = participantTimers[p.id]
      results[p.id] = timer?.state === 'stopped' ? timer.elapsed : null
    }
    session.pendingHeats.push({
      id: crypto.randomUUID(),
      number: session.pendingHeats.length + 1,
      timestamp: t,
      results
    })
    resetHeat()
  }

  function newSession() {
    commitCurrentState()
    session.pendingHeats = []
    session.sessionArchiveStart = session.archive.length
    resetHeat()
  }

  function reorderParticipants(newOrder) {
    session.participants = newOrder
  }

  function clearRoster() {
    if (!confirm('Remove all participants and clear all history?')) return
    resetHeat()
    session.participants = []
    session.archive = []
    session.pendingHeats = []
    session.sessionArchiveStart = 0
    for (const group of session.intervalConfig?.paceGroups ?? []) {
      group.participantIds = []
    }
  }

  return {
    get session() { return session },
    get heatPhase() { return heatPhase },
    get participantTimers() { return participantTimers },
    get intervalParticipants() { return intervalParticipants },
    get intervalSessionStart() { return intervalSessionStart },
    get now() { return now },
    get allStopped() { return allStopped },
    get allIntervalDone() { return allIntervalDone },
    get heatHistory() { return heatHistory },
    get canStart() { return canStart },
    get atLeastOneStopped() { return atLeastOneStopped },
    setMode,
    addParticipant,
    removeParticipant,
    startAll,
    stopParticipant,
    recordLap,
    recordIntervalRep,
    pauseAll,
    resumeAll,
    newHeat,
    newSession,
    reorderParticipants,
    clearRoster
  }
}
