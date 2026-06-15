<script>
  import { formatElapsed } from './time.js'

  let { participant, heatPhase, timer, now, onRemove, onStop } = $props()

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
  let inHeat = $derived(heatPhase !== 'idle' && timer != null)
</script>

<div class="card" class:stopped={isStopped}>
  <div class="avatar" style:background={color} aria-hidden="true">
    {participant.initials}
  </div>

  <span class="name">{participant.name}</span>

  {#if inHeat}
    <span class="elapsed" class:ticking={isRunning}>{formatElapsed(elapsed)}</span>
    {#if isStopped}
      <span class="done-badge" aria-label="Finished">✓</span>
    {:else}
      <button class="stop-btn" onclick={onStop} aria-label="Stop {participant.name}">
        Stop
      </button>
    {/if}
  {:else}
    <button
      class="remove-btn"
      disabled={heatPhase !== 'idle'}
      onclick={onRemove}
      aria-label="Remove {participant.name}"
      title={heatPhase !== 'idle' ? 'Cannot remove during a heat' : 'Remove participant'}
    >×</button>
  {/if}
</div>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
    background: var(--surface);
    border-radius: 8px;
    height: 44px;
    transition: background 0.2s;
  }

  .card.stopped {
    background: color-mix(in srgb, var(--surface) 80%, var(--running) 20%);
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

  .remove-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    font-size: 20px;
    line-height: 1;
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
    transition: opacity 0.15s;
  }

  .stop-btn:active {
    opacity: 0.8;
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
</style>