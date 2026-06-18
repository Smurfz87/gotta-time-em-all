<script>
  import { formatElapsed } from './time.js'

  let { participant, mode, heatPhase, timer, intervalTimer, now, expanded, flashKey, onToggleExpand, onRemove, onStop, onLap, onRep } = $props()

  const AVATAR_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
    '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
  ]

  function avatarColor(name) {
    let hash = 0
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }

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

    {#if mode === 'interval' && intervalTimer}
      {#if intervalTimer.state === 'active' || intervalTimer.state === 'overdue'}
        <span class="elapsed ticking" class:overdue={intervalTimer.state === 'overdue'}>
          {formatElapsed(now - intervalTimer.repStartedAt)}
        </span>
        <span class="rep-count">×{intervalTimer.reps.length}</span>
        <button class="lap-btn" onclick={onRep} aria-label="Rep {participant.name}">Rep</button>
      {:else if intervalTimer.state === 'resting'}
        <span class="rep-count">×{intervalTimer.reps.length}</span>
        <span class="resting-badge">Resting</span>
      {:else if intervalTimer.state === 'done'}
        <span class="rep-count">×{intervalTimer.reps.length}</span>
        <span class="done-badge" aria-label="Done">✓</span>
      {/if}
    {:else if inSession}
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

  {#if expanded && laps.length > 0}
    <div class="laps">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Gap</th>
            <th>Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {#each laps as lap (lap.number)}
            <tr>
              <td class="lap-num">{lap.number}</td>
              <td>{formatElapsed(lap.gap)}</td>
              <td class="cumulative">{formatElapsed(lap.cumulative)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
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

  .elapsed.overdue {
    color: var(--warning, #f59e0b);
  }

  .rep-count {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    min-width: 20px;
    text-align: right;
  }

  .resting-badge {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    flex-shrink: 0;
    opacity: 0.6;
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

  /* Lap history table */
  .laps {
    border-top: 1px solid var(--border);
  }

  .laps table {
    width: 100%;
    border-collapse: collapse;
  }

  .laps th, .laps td {
    padding: 4px 10px;
    font-size: 12px;
    text-align: right;
  }

  .laps th {
    color: var(--text-muted);
    font-weight: 600;
    font-size: 11px;
    background: color-mix(in srgb, var(--surface) 60%, var(--bg) 40%);
    border-bottom: 1px solid var(--border);
  }

  .laps td {
    font-variant-numeric: tabular-nums;
    color: var(--text);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  }

  .laps tr:last-child td {
    border-bottom: none;
  }

  .lap-num {
    text-align: left;
    color: var(--text-muted);
    font-weight: 600;
  }

  .cumulative {
    font-weight: 600;
  }
</style>