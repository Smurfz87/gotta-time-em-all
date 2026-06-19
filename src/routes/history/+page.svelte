<script>
  import { base } from '$app/paths'
  import { readSession, writeSession } from '$lib/storage.js'
  import PageShell from '$lib/PageShell.svelte'

  let archive = $state(readSession().archive ?? [])

  function saveArchive(newArchive) {
    const data = readSession()
    data.archive = newArchive
    writeSession(data)
    archive = newArchive
  }

  function deleteAll() {
    if (!confirm('Delete all history? This cannot be undone.')) return
    saveArchive([])
  }

  function exportArchive() {
    const payload = JSON.stringify({ version: 1, exportedAt: Date.now(), archive }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `gtta-archive-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  let fileInput = $state(null)

  function importArchive() {
    fileInput.click()
  }

  async function onFileSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      alert('Invalid file — could not parse JSON.')
      return
    }
    if (!Array.isArray(parsed?.archive)) {
      alert('Invalid file — missing archive data.')
      return
    }
    const incoming = parsed.archive
    if (archive.length > 0) {
      const replace = confirm(
        `Import ${incoming.length} entr${incoming.length !== 1 ? 'ies' : 'y'}?\n\nOK → Replace existing\nCancel → Merge with existing`
      )
      if (replace) {
        saveArchive(incoming)
      } else {
        const merged = new Map([...archive, ...incoming].map(e => [e.id, e]))
        saveArchive([...merged.values()])
      }
    } else {
      saveArchive(incoming)
    }
  }

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

  function entryTitle(entry) {
    if (entry.type === 'heat') return `Heat ${entry.number}`
    if (entry.type === 'interval') return `Interval ${entry.number}`
    if (entry.type === 'rest') return `Rest ${entry.number}`
    return `Run ${entry.number}`
  }

  function entrySub(entry) {
    if (entry.type === 'heat') {
      const n = heatCount(entry)
      return `${n} heat${n !== 1 ? 's' : ''}`
    }
    if (entry.type === 'interval') {
      const groups = (entry.paceGroups ?? []).length
      const reps = entry.repCount ?? '∞'
      return `${groups} group${groups !== 1 ? 's' : ''} · ${reps} reps`
    }
    if (entry.type === 'rest') {
      const s = Math.round((entry.restDuration ?? 30000) / 1000)
      const dur = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60 ? ` ${s % 60}s` : ''}`
      return entry.repCount ? `${dur} rest · ${entry.repCount} reps` : `${dur} rest`
    }
    return null
  }
</script>

<PageShell title="History" backLabel="Back to timer">
  {#snippet actions()}
    <div class="header-actions">
      <button class="hdr-btn" onclick={importArchive} aria-label="Import archive">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      {#if entries.length > 0}
        <button class="hdr-btn" onclick={exportArchive} aria-label="Export archive">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button class="hdr-btn hdr-btn--danger" onclick={deleteAll} aria-label="Delete all history">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      {/if}
    </div>
    <input bind:this={fileInput} type="file" accept=".json,application/json" onchange={onFileSelected} style="display:none" />
  {/snippet}

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
              <span class="entry-num">{entryTitle(entry)}</span>
              {#if entrySub(entry)}<span class="entry-sub">{entrySub(entry)}</span>{/if}
            </div>
            <span class="entry-time">{formatDateTime(entry.timestamp)}</span>
            <span class="entry-badge" class:heat={entry.type === 'heat'} class:run={entry.type === 'run'} class:interval={entry.type === 'interval'} class:rest={entry.type === 'rest'}>
              {entry.type === 'heat' ? 'Heat' : entry.type === 'interval' ? 'Interval' : entry.type === 'rest' ? 'Rest' : 'Run'}
            </span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</PageShell>

<style>
  .header-actions {
    display: flex;
    gap: 2px;
    margin-left: auto;
  }

  .hdr-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
  }

  .hdr-btn:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  .hdr-btn--danger:hover {
    background: color-mix(in srgb, var(--danger, #e53e3e) 12%, transparent);
    color: var(--danger, #e53e3e);
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

  .entry-badge.interval {
    background: color-mix(in srgb, var(--warning) 15%, transparent);
    color: var(--warning);
  }

  .entry-badge.rest {
    background: color-mix(in srgb, #8b5cf6 15%, transparent);
    color: #8b5cf6;
  }

  .chevron {
    color: var(--text-muted);
    flex-shrink: 0;
  }
</style>
