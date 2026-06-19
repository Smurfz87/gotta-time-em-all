import { untrack } from 'svelte'
import { readSession, writeSession, readSettings } from './storage.js'
import { getInitials } from './utils.js'
import {
  defaultSession,
  restoreSessionState,
  buildStartTimers,
  applyStopParticipant,
  applyRecordLap,
  applyRecordIntervalRep,
  advanceIntervalCycles,
  applyRecordRestRep,
  advanceRestTimers,
  buildHeatCommitEntry,
  buildIntervalCommitEntry,
  buildRunCommitEntry,
  buildRestCommitEntry
} from './sessionLogic.js'

export function createSession() {
  let session = $state({ ...defaultSession(), ...readSession() })
  let heatPhase = $state('idle')
  let participantTimers = $state({})
  let intervalParticipants = $state({})
  let restParticipants = $state({})
  let intervalSessionStart = $state(null)
  let batchAnchor = $state(null)
  let now = $state(Date.now())

  // Restore in-progress session on page reload — timestamps are wall-clock epoch
  // values so elapsed time continues accumulating correctly without any adjustment
  const restored = restoreSessionState(session)
  heatPhase = restored.heatPhase
  participantTimers = restored.participantTimers
  intervalParticipants = restored.intervalParticipants
  restParticipants = restored.restParticipants
  intervalSessionStart = restored.intervalSessionStart

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

  let allRestDone = $derived(
    session.mode === 'rest' &&
    heatPhase === 'running' &&
    session.participants.length > 0 &&
    session.participants.every(p => restParticipants[p.id]?.state === 'done')
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
    if (heatPhase !== 'running' || allStopped || allIntervalDone || allRestDone) return
    const id = setInterval(() => { now = Date.now() }, 50)
    return () => clearInterval(id)
  })

  // Reads `now` (tracked) but mutates `intervalParticipants` (untracked) to avoid a
  // reactive cycle — mutations flow to session.intervalState via the shared reference.
  $effect(() => {
    if (session.mode !== 'interval' || heatPhase !== 'running') return
    const t = now
    untrack(() => {
      advanceIntervalCycles(intervalParticipants, session.intervalConfig?.paceGroups ?? [], intervalSessionStart, t)
    })
  })

  // Same pattern for rest mode: reads `now`, mutates `restParticipants` untracked.
  $effect(() => {
    if (session.mode !== 'rest' || heatPhase !== 'running') return
    const t = now
    untrack(() => {
      advanceRestTimers(restParticipants, session.restConfig, t)
    })
  })

  $effect(() => {
    writeSession($state.snapshot(session))
  })

  function commitCurrentState() {
    const t = Date.now()
    let entry
    if (session.mode === 'heat') {
      entry = buildHeatCommitEntry(
        $state.snapshot(session.participants),
        $state.snapshot(participantTimers),
        heatPhase,
        $state.snapshot(session.pendingHeats),
        $state.snapshot(session.archive),
        t
      )
    } else if (session.mode === 'interval') {
      entry = buildIntervalCommitEntry(
        $state.snapshot(session.participants),
        $state.snapshot(intervalParticipants),
        $state.snapshot(session.intervalConfig),
        heatPhase,
        $state.snapshot(session.archive),
        t
      )
    } else if (session.mode === 'rest') {
      entry = buildRestCommitEntry(
        $state.snapshot(session.participants),
        $state.snapshot(restParticipants),
        $state.snapshot(session.restConfig),
        heatPhase,
        $state.snapshot(session.archive),
        t
      )
    } else {
      entry = buildRunCommitEntry(
        $state.snapshot(session.participants),
        $state.snapshot(participantTimers),
        heatPhase,
        $state.snapshot(session.archive),
        t
      )
    }
    if (entry) session.archive.push(entry)
  }

  function resetHeat() {
    heatPhase = 'idle'
    participantTimers = {}
    intervalParticipants = {}
    restParticipants = {}
    intervalSessionStart = null
    batchAnchor = null
    if (session.mode === 'lap') session.lapState = null
    if (session.mode === 'interval') session.intervalState = null
    if (session.mode === 'rest') session.restState = null
  }

  function setMode(m) {
    if (m === session.mode) return
    if (heatPhase !== 'idle' || session.pendingHeats.length > 0) {
      const name = m === 'heat' ? 'Heat' : m === 'lap' ? 'Lap' : m === 'rest' ? 'Rest' : 'Interval'
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
    session.participants.push({ id: crypto.randomUUID(), name: trimmed, initials: getInitials(trimmed) })
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
    const result = buildStartTimers(session.mode, session.participants, session.intervalConfig, t)
    if (session.mode === 'interval') {
      session.intervalState = { phase: 'running', sessionStart: t, participants: result.intervalParticipants }
      intervalParticipants = session.intervalState.participants
      intervalSessionStart = t
    } else if (session.mode === 'rest') {
      session.restState = { phase: 'running', participants: result.restParticipants }
      restParticipants = session.restState.participants
    } else if (session.mode === 'lap') {
      session.lapState = { phase: 'running', participants: result.participantTimers }
      participantTimers = session.lapState.participants
    } else {
      participantTimers = result.participantTimers
    }
    heatPhase = 'running'
    now = t
  }

  function stopParticipant(id) {
    applyStopParticipant(id, session.mode, participantTimers, Date.now())
  }

  function recordLap(id) {
    applyRecordLap(id, participantTimers, heatPhase, Date.now())
  }

  function recordIntervalRep(id) {
    applyRecordIntervalRep(id, intervalParticipants, intervalSessionStart, session.intervalConfig, heatPhase, Date.now())
  }

  function recordRestRep(id) {
    const t = Date.now()
    const syncWindowMs = readSettings().syncWindow ?? 3000
    if (batchAnchor === null || t > batchAnchor + syncWindowMs) batchAnchor = t
    applyRecordRestRep(id, restParticipants, session.restConfig, heatPhase, batchAnchor)
  }

  function pauseAll() {
    const t = Date.now()
    for (const id in participantTimers) {
      const timer = participantTimers[id]
      if (timer.state === 'running') {
        timer.elapsed += t - timer.startedAt
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
    session.pendingHeats.push({ id: crypto.randomUUID(), number: session.pendingHeats.length + 1, timestamp: t, results })
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
    get allRestDone() { return allRestDone },
    get heatHistory() { return heatHistory },
    get canStart() { return canStart },
    get atLeastOneStopped() { return atLeastOneStopped },
    get restParticipants() { return restParticipants },
    setMode,
    addParticipant,
    removeParticipant,
    startAll,
    stopParticipant,
    recordLap,
    recordIntervalRep,
    recordRestRep,
    pauseAll,
    resumeAll,
    newHeat,
    newSession,
    reorderParticipants,
    clearRoster
  }
}