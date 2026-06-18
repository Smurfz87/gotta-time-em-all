<script>
  import { formatElapsed } from './time.js'
  import { avatarColor } from './utils.js'
  import LapHistory from './LapHistory.svelte'

  let { participant, mode, heatPhase, timer, now, expanded, flashKey, onToggleExpand, onRemove, onStop, onLap } = $props()

  let color = $derived(avatarColor(participant.name))

  let elapsed = $derived(
    !timer ? 0
    : timer.state === 'stopped' || heatPhase === 'paused' ? timer.elapsed
    : timer.startedAt ? timer.elapsed + (now - timer.startedAt)
    : timer.elapsed
  )

  let isStopped = $derived(timer?.state === 'stopped')
  let isRunning = $derived(timer?.state === 'running' && heatPhase === 'running')
  let inSession = $derived(heatPhase !== 'idle' && timer != null)
  let laps = $derived(timer?.laps ?? [])
  let canExpand = $derived(mode === 'lap' && laps.length > 0)
</script>

<div class="card-wrap" class:has-laps={expanded && laps.length > 0}>
  <div class="card" class:stopped={isStopped}>
    <div class="drag-handle" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
        <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
        <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
      </svg>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="name-area"
      class:expandable={canExpand}
      onclick={canExpand ? onToggleExpand : null}
      role={canExpand ? 'button' : null}
      aria-expanded={canExpand ? expanded : null}
      tabindex={canExpand ? 0 : null}
      onkeydown={canExpand ? (e) => (e.key === 'Enter' || e.key === ' ') && onToggleExpand() : null}
    >
      <div class="avatar" style:background={color} aria-hidden="true">
        {participant.initials}
      </div>
      <span class="name">{participant.name}</span>
    </div>

    {#if inSession}
      <span class="elapsed" class:ticking={isRunning}>{formatElapsed(elapsed)}</span>
      {#if laps.length > 0}
        <span class="lap-count">×{laps.length}</span>
      {/if}
      {#if isStopped}
        <span class="done-badge" aria-label="Finished">✓</span>
      {:else if mode === 'lap'}
        <button class="lap-btn" onclick={onLap} aria-label="Lap {participant.name}">Lap</button>
        <button class="stop-icon-btn" onclick={onStop} aria-label="Stop {participant.name}" title="Stop">■</button>
      {:else}
        <button class="stop-btn" onclick={onStop} aria-label="Stop {participant.name}">Stop</button>
      {/if}
    {:else}
      <button
        class="remove-btn"
        disabled={heatPhase !== 'idle'}
        onclick={onRemove}
        aria-label="Remove {participant.name}"
        title={heatPhase !== 'idle' ? 'Cannot remove during a session' : 'Remove participant'}
      >×</button>
    {/if}

    {#key flashKey}
      {#if flashKey > 0}
        <div class="flash-overlay" aria-hidden="true"></div>
      {/if}
    {/key}
  </div>

  {#if expanded}
    <LapHistory {laps} />
  {/if}
</div>

<style>
  .card-wrap {
    background: var(--surface);
    border-radius: 8px;
    overflow: hidden;
  }

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 100%;
    color: var(--text-muted);
    opacity: 0.4;
    cursor: grab;
    flex-shrink: 0;
    touch-action: none;
  }

  .drag-handle:active { cursor: grabbing; }

  .card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px 0 6px;
    height: 44px;
    transition: background 0.2s;
    overflow: hidden;
  }

  .card.stopped {
    background: color-mix(in srgb, var(--surface) 80%, var(--running) 20%);
  }

  .name-area {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    height: 100%;
  }

  .name-area.expandable {
    cursor: pointer;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    user-select: none;
  }

  .name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .elapsed {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .elapsed.ticking {
    color: var(--text);
  }

  .lap-count {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    min-width: 20px;
    text-align: right;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }

  .remove-btn:hover:not(:disabled) {
    background: var(--surface-raised);
    color: var(--danger);
  }

  .remove-btn:disabled {
    opacity: 0.25;
  }

  .stop-btn {
    padding: 0 12px;
    height: 32px;
    border-radius: 6px;
    background: var(--danger);
    color: white;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .lap-btn {
    padding: 0 12px;
    height: 32px;
    border-radius: 6px;
    background: var(--accent);
    color: white;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    transition: opacity 0.1s;
  }

  .lap-btn:active {
    opacity: 0.75;
  }

  .stop-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--surface-raised);
    color: var(--danger);
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .stop-icon-btn:active {
    background: var(--danger);
    color: white;
  }

  .done-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--running);
    color: white;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Flash animation — element recreated on each lap via {#key}, restarting the animation */
  .flash-overlay {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--accent) 35%, transparent);
    animation: lap-flash 0.5s ease-out forwards;
    pointer-events: none;
  }

  @keyframes lap-flash {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
</style>
