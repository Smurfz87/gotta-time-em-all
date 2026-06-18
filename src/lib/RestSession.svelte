<script>
  import { formatElapsed, formatDuration } from './time.js'
  import { avatarColor } from './utils.js'

  let { participants, restParticipants, restConfig, now, recordRestRep } = $props()
</script>

<div class="session">
  <div class="session-header">
    <span class="config-pill">{formatDuration(restConfig?.restDuration ?? 30000)} rest</span>
    {#if restConfig?.repCount}
      <span class="config-pill">{restConfig.repCount} reps</span>
    {/if}
  </div>

  <div class="cards">
    {#each participants as p (p.id)}
      {@const rp = restParticipants[p.id]}
      {#if rp}
        <div
          class="card"
          class:resting={rp.state === 'resting'}
          class:done={rp.state === 'done'}
        >
          <div class="avatar" style:background={avatarColor(p.name)} aria-hidden="true">
            {p.initials}
          </div>
          <div class="info">
            <span class="name">{p.name}</span>
            {#if restConfig?.repCount}
              <span class="rep-progress">{rp.reps.length} / {restConfig.repCount}</span>
            {:else if rp.reps.length > 0}
              <span class="rep-progress">×{rp.reps.length}</span>
            {/if}
          </div>

          {#if rp.state === 'effort'}
            <span class="elapsed">{formatElapsed(now - rp.repStartedAt)}</span>
            <button class="rep-btn" onclick={() => recordRestRep(p.id)} aria-label="Rep {p.name}">Rep</button>
          {:else if rp.state === 'resting'}
            {@const remaining = Math.max(0, rp.restEndsAt - now)}
            <div class="countdown-block">
              <span class="countdown" class:urgent={remaining < 5000}>{formatDuration(remaining)}</span>
              <span class="next-label">next rep</span>
            </div>
          {:else if rp.state === 'done'}
            <span class="done-badge" aria-label="Done">✓</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .session {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
  }

  .session-header {
    display: flex;
    gap: 8px;
    padding: 0 2px 4px;
  }

  .config-pill {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface);
    padding: 4px 10px;
    border-radius: 100px;
    border: 1px solid var(--border);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* --- Card base --- */
  .card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px 0 14px;
    min-height: 56px;
    background: var(--surface);
    border-radius: 8px;
    transition: background 0.2s, opacity 0.2s;
  }

  /* Resting: taller + accent tint — countdown is the centrepiece, not de-emphasised */
  .card.resting {
    min-height: 76px;
    background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  }

  /* Done: fully greyed */
  .card.done {
    opacity: 0.45;
  }

  /* --- Left: avatar + stacked name / rep progress --- */
  .avatar {
    width: 32px;
    height: 32px;
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

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rep-progress {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* --- Effort state: running elapsed --- */
  .elapsed {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--text);
    flex-shrink: 0;
  }

  .rep-btn {
    padding: 0 16px;
    height: 40px;
    border-radius: 8px;
    background: var(--accent);
    color: white;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
    transition: opacity 0.1s;
    touch-action: manipulation;
  }

  .rep-btn:active {
    opacity: 0.75;
  }

  /* --- Resting state: prominent countdown --- */
  .countdown-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .countdown {
    font-size: 28px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--accent);
    line-height: 1;
    transition: color 0.3s;
  }

  .countdown.urgent {
    color: var(--warning);
  }

  .next-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    margin-top: 3px;
    text-align: right;
  }

  /* --- Done state --- */
  .done-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--running);
    color: white;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>