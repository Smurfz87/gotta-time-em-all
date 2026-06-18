<script>
  import { formatElapsed, formatDuration } from './time.js'

  let { intervalConfig, intervalParticipants, intervalSessionStart, participants, now, recordIntervalRep } = $props()

  const AVATAR_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
    '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
  ]

  function avatarColor(name) {
    let hash = 0
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }

  let participantMap = $derived(
    Object.fromEntries(participants.map(p => [p.id, p]))
  )

  function groupCountdown(sendOff) {
    if (!intervalSessionStart) return 0
    const elapsed = now - intervalSessionStart
    const currentCycle = Math.floor(elapsed / sendOff)
    return Math.max(0, intervalSessionStart + (currentCycle + 1) * sendOff - now)
  }

  function currentCycle(sendOff) {
    if (!intervalSessionStart) return 0
    return Math.floor((now - intervalSessionStart) / sendOff)
  }
</script>

<div class="session">
  {#each intervalConfig.paceGroups as group (group.id)}
    {@const cycle = currentCycle(group.sendOff)}
    {@const countdown = groupCountdown(group.sendOff)}
    {@const repCount = intervalConfig.repCount}

    <div class="group-section">
      <div class="group-header">
        <div class="group-meta">
          <span class="group-name">{group.name}</span>
          <span class="group-sendoff">{formatDuration(group.sendOff)}</span>
        </div>
        <div class="group-clock">
          <span class="countdown" class:urgent={countdown < 5000}>{formatDuration(countdown)}</span>
          {#if repCount}
            <span class="rep-indicator">Rep {Math.min(cycle + 1, repCount)} of {repCount}</span>
          {/if}
        </div>
      </div>

      {#each group.participantIds as pId (pId)}
        {@const p = participantMap[pId]}
        {@const timer = intervalParticipants[pId]}
        {#if p && timer}
          <div
            class="p-card"
            class:resting={timer.state === 'resting'}
            class:overdue={timer.state === 'overdue'}
            class:done={timer.state === 'done'}
          >
            <div class="avatar" style:background={avatarColor(p.name)} aria-hidden="true">
              {p.initials}
            </div>
            <span class="p-name">{p.name}</span>
            <span class="rep-count">×{timer.reps.length}</span>

            {#if timer.state === 'active'}
              <span class="elapsed ticking">{formatElapsed(now - timer.repStartedAt)}</span>
              <button class="rep-btn" onclick={() => recordIntervalRep(pId)} aria-label="Rep {p.name}">Rep</button>
            {:else if timer.state === 'overdue'}
              <span class="elapsed overdue-elapsed">{formatElapsed(now - timer.repStartedAt)}</span>
              <button class="rep-btn overdue-btn" onclick={() => recordIntervalRep(pId)} aria-label="Rep {p.name}">Rep</button>
            {:else if timer.state === 'resting'}
              <span class="resting-label">Resting</span>
            {:else if timer.state === 'done'}
              <span class="done-badge" aria-label="Done">✓</span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  .session {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 8px 0;
  }

  .group-section {
    background: var(--surface);
    border-radius: 8px;
    overflow: hidden;
  }

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: 52px;
    background: color-mix(in srgb, var(--surface) 60%, var(--bg) 40%);
    border-bottom: 1px solid var(--border);
  }

  .group-meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }

  .group-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .group-sendoff {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .group-clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .countdown {
    font-size: 22px;
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

  .rep-indicator {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    margin-top: 2px;
  }

  /* Participant card */
  .p-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px 0 14px;
    height: 48px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    transition: background 0.2s;
  }

  .p-card:last-child {
    border-bottom: none;
  }

  .p-card.resting {
    opacity: 0.45;
  }

  .p-card.overdue {
    background: color-mix(in srgb, var(--warning) 10%, var(--surface));
  }

  .p-card.done {
    background: color-mix(in srgb, var(--running) 8%, var(--surface));
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

  .p-name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }

  .rep-count {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    flex-shrink: 0;
    min-width: 20px;
    text-align: right;
  }

  .elapsed {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .elapsed.ticking {
    color: var(--text);
  }

  .elapsed.overdue-elapsed {
    color: var(--warning);
  }

  .resting-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    flex-shrink: 0;
  }


  .rep-btn {
    padding: 0 14px;
    height: 34px;
    border-radius: 6px;
    background: var(--accent);
    color: white;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    transition: opacity 0.1s;
  }

  .rep-btn:active {
    opacity: 0.75;
  }

  .rep-btn.overdue-btn {
    background: var(--warning);
    color: #000;
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
