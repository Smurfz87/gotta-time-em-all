<script>
  let {
    mode, heatPhase, canStart, allStopped, allRestDone, atLeastOneStopped,
    startAll, pauseAll, resumeAll, newHeat, newSession, clearRoster
  } = $props()
</script>

<div class="controls">
  {#if heatPhase === 'idle'}
    <button class="btn btn-primary" disabled={!canStart} onclick={startAll}>
      Start all
    </button>
    <button class="btn btn-secondary" onclick={newSession}>New session</button>
    <button class="btn btn-ghost-danger" onclick={clearRoster}>Clear roster</button>

  {:else if heatPhase === 'running'}
    {#if mode === 'interval'}
      <button class="btn btn-secondary btn-full" onclick={newSession}>New session</button>
    {:else if mode === 'rest'}
      {#if allRestDone}
        <button class="btn btn-primary" onclick={newSession}>New session</button>
        <button class="btn btn-ghost-danger" onclick={clearRoster}>Clear roster</button>
      {:else}
        <button class="btn btn-secondary btn-full" onclick={newSession}>New session</button>
      {/if}
    {:else if allStopped}
      {#if mode === 'heat'}
        <button class="btn btn-primary" onclick={newHeat}>New Heat</button>
      {/if}
      <button class="btn btn-secondary" onclick={newSession}>New session</button>
      <button class="btn btn-ghost-danger" onclick={clearRoster}>Clear roster</button>
    {:else if atLeastOneStopped && mode === 'heat'}
      <button class="btn btn-secondary" onclick={pauseAll}>Pause all</button>
      <button class="btn btn-primary" onclick={newHeat}>New Heat</button>
    {:else}
      <button class="btn btn-primary btn-full" onclick={pauseAll}>Pause all</button>
    {/if}

  {:else if heatPhase === 'paused'}
    <button class="btn btn-primary" onclick={resumeAll}>Resume all</button>
    {#if atLeastOneStopped && mode === 'heat'}
      <button class="btn btn-secondary" onclick={newHeat}>New Heat</button>
    {:else}
      <button class="btn btn-secondary" onclick={newSession}>New session</button>
      <button class="btn btn-ghost-danger" onclick={clearRoster}>Clear roster</button>
    {/if}
  {/if}
</div>

<style>
  .controls {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .btn {
    flex: 1;
    min-height: 48px;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    transition: opacity 0.15s, background 0.15s;
  }

  .btn-full {
    flex: 1;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:disabled {
    opacity: 0.35;
  }

  .btn-primary:active:not(:disabled) {
    opacity: 0.85;
  }

  .btn-secondary {
    background: var(--surface-raised);
    color: var(--text);
  }

  .btn-secondary:active {
    opacity: 0.7;
  }

  .btn-ghost-danger {
    background: transparent;
    color: var(--danger);
    border: 1.5px solid var(--danger);
    opacity: 0.8;
  }

  .btn-ghost-danger:active {
    opacity: 1;
  }
</style>