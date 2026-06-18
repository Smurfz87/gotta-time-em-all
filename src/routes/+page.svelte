<script>
  import TopBar from '$lib/TopBar.svelte'
  import ParticipantList from '$lib/ParticipantList.svelte'
  import IntervalSetup from '$lib/IntervalSetup.svelte'
  import IntervalSession from '$lib/IntervalSession.svelte'
  import RestSession from '$lib/RestSession.svelte'
  import BottomControls from '$lib/BottomControls.svelte'
  import { readSettings } from '$lib/storage.js'
  import { createSession } from '$lib/session.svelte.js'

  const settings = { vibrateOnLap: false, ...readSettings() }
  const s = createSession()
</script>

<div class="shell">
  <TopBar
    mode={s.session.mode}
    onModeChange={s.setMode}
  />
  <main>
    {#if s.session.mode === 'interval'}
      {#if s.heatPhase === 'idle'}
        <IntervalSetup
          intervalConfig={s.session.intervalConfig}
          participants={s.session.participants}
          addParticipant={s.addParticipant}
        />
      {:else}
        <IntervalSession
          intervalConfig={s.session.intervalConfig}
          intervalParticipants={s.intervalParticipants}
          intervalSessionStart={s.intervalSessionStart}
          participants={s.session.participants}
          now={s.now}
          recordIntervalRep={s.recordIntervalRep}
        />
      {/if}
    {:else if s.session.mode === 'rest' && s.heatPhase !== 'idle'}
      <RestSession
        participants={s.session.participants}
        restParticipants={s.restParticipants}
        restConfig={s.session.restConfig}
        now={s.now}
        recordRestRep={s.recordRestRep}
      />
    {:else}
      <ParticipantList
        participants={s.session.participants}
        history={s.heatHistory}
        mode={s.session.mode}
        heatPhase={s.heatPhase}
        participantTimers={s.participantTimers}
        now={s.now}
        addParticipant={s.addParticipant}
        removeParticipant={s.removeParticipant}
        reorderParticipants={s.reorderParticipants}
        stopParticipant={s.stopParticipant}
        recordLap={s.recordLap}
        vibrateOnLap={settings.vibrateOnLap}
      />
    {/if}
  </main>
  <BottomControls
    mode={s.session.mode}
    heatPhase={s.heatPhase}
    canStart={s.canStart}
    allStopped={s.allStopped}
    allRestDone={s.allRestDone}
    atLeastOneStopped={s.atLeastOneStopped}
    startAll={s.startAll}
    pauseAll={s.pauseAll}
    resumeAll={s.resumeAll}
    newHeat={s.newHeat}
    newSession={s.newSession}
    clearRoster={s.clearRoster}
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