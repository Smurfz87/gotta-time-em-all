<script>
  import { base } from '$app/paths'

  const STORAGE_KEY = 'gtta:session'

  function loadArchive() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw).archive ?? []) : []
    } catch {}
    return []
  }

  let archive = $state(loadArchive())

  let entries = $derived(
    [...archive].sort((a, b) => b.timestamp - a.timestamp)
  )

  function formatDateTime(ts) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function heatCount(entry) {
    return (entry.heats ?? [entry]).length
  }
</script>

<div class="page">
  <header>
    <a href="{base}/" class="back-btn" aria-label="Back to timer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </a>
    <h1>History</h1>
  </header>

  <main>
    {#if entries.length === 0}
      <div class="empty-state">
        <span class="icon" aria-hidden="true">📋</span>
        <p>No recorded sessions yet.</p>
      </div>
    {:else}
      <ul class="entry-list">
        {#each entries as entry (entry.id)}
          <li>
            <a href="{base}/history/{entry.id}" class="entry-row">
              <div class="entry-info">
                <span class="entry-num">
                  {entry.type === 'heat' ? 'Heat Session' : 'Run'} {entry.number}
                </span>
                {#if entry.type === 'heat'}
                  {@const n = heatCount(entry)}
                  <span class="entry-sub">{n} heat{n !== 1 ? 's' : ''}</span>
                {/if}
              </div>
              <span class="entry-time">{formatDateTime(entry.timestamp)}</span>
              <span class="entry-badge" class:heat={entry.type === 'heat'} class:run={entry.type === 'run'}>
                {entry.type === 'heat' ? 'Heat' : 'Run'}
              </span>
              <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    height: 56px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  h1 {
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
  }

  main {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    text-align: center;
    padding: 48px 32px;
  }

  .icon {
    font-size: 36px;
    opacity: 0.4;
  }

  p { font-size: 15px; }

  .entry-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .entry-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--surface);
    border-radius: var(--radius);
    text-decoration: none;
    color: var(--text);
    transition: background 0.15s;
  }

  .entry-row:active {
    background: var(--surface-raised);
  }

  .entry-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .entry-num {
    font-size: 15px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  .entry-time {
    font-size: 13px;
    color: var(--text-muted);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .entry-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .entry-badge.heat {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent);
  }

  .entry-badge.run {
    background: color-mix(in srgb, var(--running) 15%, transparent);
    color: var(--running);
  }

  .chevron {
    color: var(--text-muted);
    flex-shrink: 0;
  }
</style>
