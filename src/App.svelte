<script>
  import TopBar from './lib/TopBar.svelte'
  import ParticipantList from './lib/ParticipantList.svelte'
  import BottomControls from './lib/BottomControls.svelte'

  let mode = $state('heat')
</script>

<div class="shell">
  <TopBar {mode} onModeChange={(m) => { mode = m }} />
  <main>
    <ParticipantList />
  </main>
  <BottomControls />
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