<script>
  import { formatElapsed } from './time.js'

  let { history, participants } = $props()
</script>

<div class="grid-wrapper">
  <table>
    <thead>
      <tr>
        <th class="heat-col"></th>
        {#each participants as p (p.id)}
          <th>{p.name}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each history as heat (heat.id)}
        <tr>
          <td class="heat-label">Heat {heat.number}</td>
          {#each participants as p (p.id)}
            <td class="result" class:dnf={heat.results[p.id] == null}>
              {heat.results[p.id] != null ? formatElapsed(heat.results[p.id]) : '—'}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .grid-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    margin-top: 16px;
  }

  table {
    border-collapse: collapse;
    min-width: 100%;
    white-space: nowrap;
  }

  th, td {
    padding: 10px 16px;
    text-align: right;
    font-size: 14px;
  }

  th {
    background: var(--surface-raised);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
  }

  th.heat-col {
    text-align: left;
    min-width: 80px;
  }

  td {
    border-bottom: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  tr:last-child td {
    border-bottom: none;
  }

  td.heat-label {
    text-align: left;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  td.result {
    color: var(--text);
  }

  td.dnf {
    color: var(--text-muted);
  }

  tbody tr:hover {
    background: var(--surface);
  }
</style>