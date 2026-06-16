<script>
  import TopBar from '$lib/TopBar.svelte'
  import ParticipantList from '$lib/ParticipantList.svelte'
  import BottomControls from '$lib/BottomControls.svelte'

  const STORAGE_KEY = 'gtta:session'

  function defaultSession() {
    return { mode: 'heat', participants: [], archive: [], sessionArchiveStart: 0, lapState: null }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return defaultSession()
      const saved = JSON.parse(raw)
      return { ...defaultSession(), ...saved }
    } catch {}
    return defaultSession()
  }

  function getInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
  }

  let session = $state(loadSession())
  let heatPhase = $state('idle')
  let participantTimers = $state({})
  let sessionTimer = $state({ elapsed: 0, startedAt: null })
  let now = $state(Date.now())

  // Restore lap session on page reload — startedAt timestamps are wall-clock epoch
  // values so elapsed time continues accumulating correctly without any adjustment
  if (session.lapState?.phase && session.lapState.phase !== 'idle') {
    heatPhase = session.lapState.phase
    participantTimers = session.lapState.participants ?? {}
    sessionTimer = {
      elapsed: session.lapState.sessionElapsed ?? 0,
      startedAt: session.lapState.sessionStartedAt ?? null
    }
  }

  $effect(() => {
    if (heatPhase !== 'running' || allStopped) return
    const id = setInterval(() => { now = Date.now() }, 50)
    return () => clearInterval(id)
  })

  $effect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(session)))
  })

  let sessionElapsed = $derived(
    heatPhase === 'paused' || !sessionTimer.startedAt
      ? sessionTimer.elapsed
      : sessionTimer.elapsed + (now - sessionTimer.startedAt)
  )

  let allStopped = $derived(
    heatPhase !== 'idle' &&
    session.participants.length > 0 &&
    session.participants.every(p => participantTimers[p.id]?.state === 'stopped')
  )

  let heatHistory = $derived(
    session.archive.slice(session.sessionArchiveStart).filter(e => e.type === 'heat')
  )

  let atLeastOneStopped = $derived(
    heatPhase !== 'idle' &&
    session.participants.some(p => participantTimers[p.id]?.state === 'stopped')
  )

  function commitCurrentState() {
    if (heatPhase === 'idle') return
    const t = Date.now()
    if (session.mode === 'heat') {
      const results = {}
      for (const p of session.participants) {
        const timer = participantTimers[p.id]
        if (!timer) { results[p.id] = null; continue }
        results[p.id] = timer.state === 'stopped'
          ? timer.elapsed
          : timer.elapsed + (t - timer.startedAt)
      }
      session.archive.push({
        id: crypto.randomUUID(),
        type: 'heat',
        number: session.archive.filter(e => e.type === 'heat').length + 1,
        timestamp: t,
        participants: $state.snapshot(session.participants),
        results
      })
    } else {
      const results = {}
      for (const p of session.participants) {
        const timer = participantTimers[p.id]
        if (!timer) { results[p.id] = { laps: [], elapsed: 0 }; continue }
        const elapsed = timer.state === 'stopped'
          ? timer.elapsed
          : timer.elapsed + (t - timer.startedAt)
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

  function setMode(m) {
    if (m === session.mode) return
    if (heatPhase !== 'idle') {
      if (!confirm(`Switch to ${m === 'heat' ? 'Heat' : 'Lap'} mode? The current session will be saved and reset.`)) return
      commitCurrentState()
    }
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
  }

  function resetHeat() {
    heatPhase = 'idle'
    participantTimers = {}
    sessionTimer = { elapsed: 0, startedAt: null }
    if (session.mode === 'lap') session.lapState = null
  }

  function startAll() {
    const t = Date.now()
    if (session.mode === 'lap') {
      const participants = {}
      for (const p of session.participants) {
        participants[p.id] = { state: 'running', elapsed: 0, startedAt: t, laps: [] }
      }
      session.lapState = { phase: 'running', sessionElapsed: 0, sessionStartedAt: t, participants }
      participantTimers = session.lapState.participants
    } else {
      const timers = {}
      for (const p of session.participants) {
        timers[p.id] = { state: 'running', elapsed: 0, startedAt: t }
      }
      participantTimers = timers
    }
    sessionTimer = { elapsed: 0, startedAt: t }
    heatPhase = 'running'
    now = t
  }

  function stopParticipant(id) {
    const timer = participantTimers[id]
    if (!timer || timer.state !== 'running') return
    const t = Date.now()
    timer.elapsed += t - timer.startedAt
    timer.startedAt = null
    timer.state = 'stopped'
    // freeze session clock when everyone is done
    const allDone = session.participants.every(p => participantTimers[p.id]?.state === 'stopped')
    if (allDone && sessionTimer.startedAt) {
      sessionTimer.elapsed += t - sessionTimer.startedAt
      sessionTimer.startedAt = null
      if (session.mode === 'lap' && session.lapState) {
        session.lapState.sessionElapsed = sessionTimer.elapsed
        session.lapState.sessionStartedAt = null
      }
    }
  }

  function recordLap(id) {
    const timer = participantTimers[id]
    if (!timer || timer.state !== 'running' || heatPhase !== 'running') return
    const t = Date.now()
    const cumulative = timer.elapsed + (t - timer.startedAt)
    const prev = timer.laps[timer.laps.length - 1]
    const gap = prev ? cumulative - prev.cumulative : cumulative
    timer.laps.push({ number: timer.laps.length + 1, cumulative, gap })
  }

  function pauseAll() {
    const t = Date.now()
    for (const id in participantTimers) {
      const timer = participantTimers[id]
      if (timer.state === 'running' && timer.startedAt) {
        timer.elapsed += t - timer.startedAt
        timer.startedAt = null
      }
    }
    sessionTimer.elapsed += t - sessionTimer.startedAt
    sessionTimer.startedAt = null
    if (session.mode === 'lap' && session.lapState) {
      session.lapState.phase = 'paused'
      session.lapState.sessionElapsed = sessionTimer.elapsed
      session.lapState.sessionStartedAt = null
    }
    heatPhase = 'paused'
  }

  function resumeAll() {
    const t = Date.now()
    for (const id in participantTimers) {
      const timer = participantTimers[id]
      if (timer.state === 'running') timer.startedAt = t
    }
    sessionTimer.startedAt = t
    if (session.mode === 'lap' && session.lapState) {
      session.lapState.phase = 'running'
      session.lapState.sessionStartedAt = t
    }
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
    session.archive.push({
      id: crypto.randomUUID(),
      type: 'heat',
      number: session.archive.filter(e => e.type === 'heat').length + 1,
      timestamp: t,
      participants: $state.snapshot(session.participants),
      results
    })
    resetHeat()
  }

  function newSession() {
    if (heatPhase !== 'idle') commitCurrentState()
    session.sessionArchiveStart = session.archive.length
    resetHeat()
  }

  function clearRoster() {
    if (!confirm('Remove all participants and clear all history?')) return
    resetHeat()
    session.participants = []
    session.archive = []
    session.sessionArchiveStart = 0
  }
</script>

<div class="shell">
  <TopBar
    mode={session.mode}
    onModeChange={setMode}
    {sessionElapsed}
    {heatPhase}
  />
  <main>
    <ParticipantList
      participants={session.participants}
      history={heatHistory}
      mode={session.mode}
      {heatPhase}
      {participantTimers}
      {now}
      {addParticipant}
      {removeParticipant}
      {stopParticipant}
      {recordLap}
    />
  </main>
  <BottomControls
    mode={session.mode}
    {heatPhase}
    hasParticipants={session.participants.length > 0}
    {allStopped}
    {atLeastOneStopped}
    {startAll}
    {pauseAll}
    {resumeAll}
    {newHeat}
    {newSession}
    {clearRoster}
  />
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
  }

  main {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px;
  }

  @media (min-width: 768px) {
    .shell {
      max-width: 680px;
      margin: 0 auto;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
    }
  }
</style>