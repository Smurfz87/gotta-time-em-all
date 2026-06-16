<script>
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import { formatElapsed } from '$lib/time.js'

  let { data } = $props()

  const STORAGE_KEY = 'gtta:session'

  function loadArchive() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw).archive ?? []) : []
    } catch {}
    return []
  }

  let archive = $state(loadArchive())
  let entry = $derived(archive.find(e => e.id === data.id) ?? null)

  function exportCsv() {
    if (!entry) return
    const date = new Date(entry.timestamp).toISOString().slice(0, 10)
    const filename = `${entry.type}-${date}.csv`
    let csv = ''

    if (entry.type === 'heat') {
      const sorted = heatResults()
      const heatList = heats
      const header = ['Participant', ...heatList.map(h => `Heat ${h.number}`), 'Best'].join(',')
      const rows = sorted.map(p => {
        const times = heatList.map(h => {
          const t = h.results[p.id]
          return t != null ? formatElapsed(t) : 'DNF'
        })
        const best = heatList.reduce((m, h) => {
          const t = h.results[p.id]
          return t != null && (m == null || t < m) ? t : m
        }, null)
        return [p.name, ...times, best != null ? formatElapsed(best) : 'DNF'].join(',')
      })
      csv = [header, ...rows].join('\n')
    } else {
      const lines = ['Participant,Lap,Gap,Cumulative']
      for (const p of entry.participants) {
        const result = entry.results[p.id]
        if (!result) continue
        for (const lap of result.laps) {
          lines.push(`${p.name},${lap.number},${formatElapsed(lap.gap)},${formatElapsed(lap.cumulative)}`)
        }
        lines.push(`${p.name},Total,,${formatElapsed(result.elapsed)}`)
      }
      csv = lines.join('\n')
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function deleteEntry() {
    if (!entry) return
    if (!confirm('Delete this entry? This cannot be undone.')) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const saved = raw ? JSON.parse(raw) : {}
      saved.archive = (saved.archive ?? []).filter(e => e.id !== entry.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {}
    goto(`${base}/history`)
  }

  // Support both new format (entry.heats[]) and old single-heat entries
  let heats = $derived(
    entry?.heats ?? (entry ? [{ id: entry.id, number: 1, results: entry.results }] : [])
  )

  let heatResults = $derived(() => {
    if (!entry || entry.type !== 'heat') return []
    const participants = entry.participants ?? []
    // Sort by best (fastest) result across all heats
    return [...participants].sort((a, b) => {
      const bestA = heats.reduce((m, h) => {
        const t = h.results[a.id]
        return t != null && (m == null || t < m) ? t : m
      }, null)
      const bestB = heats.reduce((m, h) => {
        const t = h.results[b.id]
        return t != null && (m == null || t < m) ? t : m
      }, null)
      if (bestA == null && bestB == null) return 0
      if (bestA == null) return 1
      if (bestB == null) return -1
      return bestA - bestB
    })
  })
</script>

<div class="page">
  <header>
    <a href="{base}/history" class="back-btn" aria-label="Back to history">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </a>
    {#if entry}
      <h1>{entry.type === 'heat' ? 'Heat Session' : 'Run'} {entry.number}</h1>
    {:else}
      <h1>Entry</h1>
    {/if}
  </header>

  <main>
    {#if !entry}
      <div class="empty-state"><p>Entry not found.</p></div>

    {:else if entry.type === 'heat'}
      <div class="card">
        <table>
          <thead>
            <tr>
              <th class="col-heat"></th>
              {#each heatResults() as p (p.id)}
                <th>{p.name}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each heats as heat (heat.id)}
              <tr>
                <td class="col-heat">Heat {heat.number}</td>
                {#each heatResults() as p (p.id)}
                  {@const t = heat.results[p.id]}
                  <td class:dnf={t == null}>{t != null ? formatElapsed(t) : '—'}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    {:else}
      <div class="runs">
        {#each entry.participants as p (p.id)}
          {@const result = entry.results[p.id]}
          <div class="run-card">
            <div class="run-header">
              <span class="run-name">{p.name}</span>
              <span class="run-total">{result ? formatElapsed(result.elapsed) : '—'}</span>
            </div>
            {#if result && result.laps.length > 0}
              <table>
                <thead>
                  <tr>
                    <th class="col-lap">#</th>
                    <th>Gap</th>
                    <th>Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {#each result.laps as lap (lap.number)}
                    <tr>
                      <td class="col-lap">{lap.number}</td>
                      <td>{formatElapsed(lap.gap)}</td>
                      <td class="cumulative">{formatElapsed(lap.cumulative)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <p class="no-laps">No laps recorded</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if entry}
      <div class="action-row">
        <button class="export-btn" onclick={exportCsv}>Export CSV</button>
        <button class="delete-btn" onclick={deleteEntry}>Delete entry</button>
      </div>
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
    color: var(--text-muted);
    text-align: center;
    padding: 48px 0;
    font-size: 15px;
  }

  /* Heat grid */
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
  }

  th, td {
    padding: 10px 14px;
    font-size: 14px;
    text-align: right;
  }

  th {
    background: var(--surface-raised);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 12px;
    border-bottom: 1px solid var(--border);
  }

  td {
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    font-variant-numeric: tabular-nums;
    color: var(--text);
    font-weight: 500;
  }

  tr:last-child td { border-bottom: none; }

  .col-heat {
    text-align: left;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
    min-width: 72px;
  }

  td.dnf { color: var(--text-muted); }

  /* Run cards */
  .runs {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .run-card {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .run-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }

  .run-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }

  .run-total {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
  }

  .col-lap {
    text-align: left;
    color: var(--text-muted);
    font-weight: 600;
    width: 32px;
  }

  .cumulative { font-weight: 600; }

  .no-laps {
    padding: 10px 14px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .action-row {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .export-btn, .delete-btn {
    padding: 10px 24px;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    transition: background 0.15s;
  }

  .export-btn {
    background: var(--surface);
    color: var(--text);
  }

  .export-btn:hover {
    background: var(--surface-raised);
  }

  .delete-btn {
    background: color-mix(in srgb, var(--danger, #e53e3e) 12%, transparent);
    color: var(--danger, #e53e3e);
  }

  .delete-btn:hover {
    background: color-mix(in srgb, var(--danger, #e53e3e) 22%, transparent);
  }
</style>
