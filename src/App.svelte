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
  let running = $state(false)

  $effect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(session)))
  })

  function setMode(m) {
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
    session.participants = session.participants.filter(p => p.id !== id)
  }

  function newSession() {
    session.history = []
  }

  function clearRoster() {
    if (!confirm('Remove all participants and clear all history?')) return
    session.participants = []
    session.history = []
  }
</script>

<div class="shell">
  <TopBar mode={session.mode} onModeChange={setMode} />
  <main>
    <ParticipantList
      participants={session.participants}
      {running}
      {addParticipant}
      {removeParticipant}
    />
  </main>
  <BottomControls
    {running}
    hasParticipants={session.participants.length > 0}
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
    padding: 12px;
  }
</style>
