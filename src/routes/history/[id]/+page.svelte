<script>
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import { formatElapsed, formatDuration } from '$lib/time.js'
  import { readSession, writeSession } from '$lib/storage.js'
  import { buildHeatCsv, buildRunCsv, buildIntervalCsv, buildRestCsv } from '$lib/csv.js'
  import PageShell from '$lib/PageShell.svelte'

  let { data } = $props()

  let archive = $state(readSession().archive ?? [])
  let entry = $derived(archive.find(e => e.id === data.id) ?? null)

  function exportCsv() {
    if (!entry) return
    const date = new Date(entry.timestamp).toISOString().slice(0, 10)
    let csv
    if (entry.type === 'heat') csv = buildHeatCsv(entry)
    else if (entry.type === 'interval') csv = buildIntervalCsv(entry)
    else if (entry.type === 'rest') csv = buildRestCsv(entry)
    else csv = buildRunCsv(entry)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.type}-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function deleteEntry() {
    if (!entry) return
    if (!confirm('Delete this entry? This cannot be undone.')) return
    const saved = readSession()
    saved.archive = (saved.archive ?? []).filter(e => e.id !== entry.id)
    writeSession(saved)
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

<PageShell
  title={entry ? `${entry.type === 'heat' ? 'Heat' : entry.type === 'interval' ? 'Interval' : entry.type === 'rest' ? 'Rest' : 'Run'} ${entry.number}` : 'Entry'}
  backHref="/history"
  backLabel="Back to history"
>
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

    {:else if entry.type === 'interval'}
      <div class="interval-session">
        {#each entry.paceGroups ?? [] as group (group.id)}
          {@const groupParticipants = (group.participantIds ?? [])
            .map(id => entry.participants.find(p => p.id === id))
            .filter(Boolean)}
          {@const repLists = groupParticipants.map(p => entry.results?.[p.id]?.reps ?? [])}
          {@const maxReps = Math.max(0, ...repLists.map(r => r.length))}

          <div class="group-block">
            <div class="int-group-header">
              <span class="int-group-name">{group.name}</span>
              <span class="int-group-sendoff">{formatDuration(group.sendOff)}</span>
            </div>

            {#if maxReps > 0}
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th class="col-rep"></th>
                      {#each groupParticipants as p (p.id)}
                        <th>{p.name}</th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each Array.from({length: maxReps}, (_, i) => i) as repIdx}
                      <tr>
                        <td class="col-rep">Rep {repIdx + 1}</td>
                        {#each repLists as pReps}
                          {@const rep = pReps[repIdx]}
                          {#if rep}
                            <td class:overdue-rep={rep.elapsed > group.sendOff}>{formatElapsed(rep.elapsed)}</td>
                          {:else}
                            <td class="dnf">—</td>
                          {/if}
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td class="col-rep footer-label">Avg</td>
                      {#each repLists as pReps}
                        {@const avg = pReps.length > 0 ? pReps.reduce((s, r) => s + r.elapsed, 0) / pReps.length : null}
                        <td class="footer-val">{avg != null ? formatElapsed(avg) : '—'}</td>
                      {/each}
                    </tr>
                  </tfoot>
                </table>
              </div>
            {:else}
              <p class="no-reps">No reps recorded</p>
            {/if}
          </div>
        {/each}
      </div>

    {:else if entry.type === 'rest'}
      <div class="rest-session">
        {#each entry.participants as p (p.id)}
          {@const reps = entry.results?.[p.id]?.reps ?? []}
          {@const avg = reps.length > 0 ? reps.reduce((s, r) => s + r.elapsed, 0) / reps.length : null}
          <div class="rest-card">
            <div class="rest-card-header">
              <span class="rest-name">{p.name}</span>
              <span class="rest-rep-count">{reps.length}{entry.repCount ? ` / ${entry.repCount}` : ''} rep{reps.length !== 1 ? 's' : ''}</span>
            </div>
            {#if reps.length > 0}
              <table>
                <thead>
                  <tr>
                    <th class="col-rep">Rep</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {#each reps as rep (rep.number)}
                    <tr>
                      <td class="col-rep">{rep.number}</td>
                      <td>{formatElapsed(rep.elapsed)}</td>
                    </tr>
                  {/each}
                </tbody>
                <tfoot>
                  <tr>
                    <td class="col-rep footer-label">Avg</td>
                    <td class="footer-val">{avg != null ? formatElapsed(avg) : '—'}</td>
                  </tr>
                </tfoot>
              </table>
            {:else}
              <p class="no-reps">No reps recorded</p>
            {/if}
          </div>
        {/each}
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
</PageShell>

<style>
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

  /* Interval session */
  .interval-session {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .group-block {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .int-group-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 60%, var(--bg) 40%);
  }

  .int-group-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .int-group-sendoff {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .overdue-rep {
    color: var(--warning);
    font-style: italic;
  }

  .footer-label {
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .footer-val {
    font-weight: 600;
  }

  tfoot tr td {
    border-top: 1px solid var(--border);
    border-bottom: none;
    background: color-mix(in srgb, var(--surface) 60%, var(--bg) 40%);
  }

  .no-reps {
    padding: 10px 14px;
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Rest session */
  .rest-session {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rest-card {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .rest-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }

  .rest-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }

  .rest-rep-count {
    font-size: 13px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

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
