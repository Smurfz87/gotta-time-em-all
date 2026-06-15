<script>
  import TopBar from './lib/TopBar.svelte'
  import ParticipantList from './lib/ParticipantList.svelte'
  import BottomControls from './lib/BottomControls.svelte'

  const STORAGE_KEY = 'gtta:session'

  function loadSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return { mode: 'heat', participants: [], history: [] }
  }

  function getInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
  }

  let session = $state(loadSession())

  // heatPhase: 'idle' | 'running' | 'paused'
  let heatPhase = $state('idle')

  // per-participant: { state: 'running'|'stopped', elapsed: number, startedAt: number|null }
  let participantTimers = $state({})

  // session-wide clock (independent of individual participant timers)
  let sessionTimer = $state({ elapsed: 0, startedAt: null })

  // ticks every 50ms while running to drive live display
  let now = $state(Date.now())

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

  let atLeastOneStopped = $derived(
    heatPhase !== 'idle' &&
    session.participants.some(p => participantTimers[p.id]?.state === 'stopped')
  )

  function setMode(m) {
    if (heatPhase !== 'idle') return
    if (session.history.length > 0) {
      if (!confirm(`Switch to ${m === 'heat' ? 'Heat' : 'Lap'} mode? This will reset the current session.`)) return
    }
    session.mode = m
    session.history = []
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
  }

  function newHeat() {
    const results = {}
    for (const p of session.participants) {
      const timer = participantTimers[p.id]
      results[p.id] = timer?.state === 'stopped' ? timer.elapsed : null
    }
    session.history.push({
      id: crypto.randomUUID(),
      number: session.history.length + 1,
      results
    })
    resetHeat()
  }

  function startAll() {
    const t = Date.now()
    const timers = {}
    for (const p of session.participants) {
      timers[p.id] = { state: 'running', elapsed: 0, startedAt: t }
    }
    participantTimers = timers
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
    // freeze session clock when the last participant finishes
    const allDone = session.participants.every(p => participantTimers[p.id]?.state === 'stopped')
    if (allDone && sessionTimer.startedAt) {
      sessionTimer.elapsed += t - sessionTimer.startedAt
      sessionTimer.startedAt = null
    }
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
    heatPhase = 'paused'
  }

  function resumeAll() {
    const t = Date.now()
    for (const id in participantTimers) {
      const timer = participantTimers[id]
      if (timer.state === 'running') timer.startedAt = t
    }
    sessionTimer.startedAt = t
    now = t
    heatPhase = 'running'
  }

  function newSession() {
    resetHeat()
    session.history = []
  }

  function clearRoster() {
    if (!confirm('Remove all participants and clear all history?')) return
    resetHeat()
    session.participants = []
    session.history = []
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
      history={session.history}
      {heatPhase}
      {participantTimers}
      {now}
      {addParticipant}
      {removeParticipant}
      {stopParticipant}
    />
  </main>
  <BottomControls
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
</style>