<script>
  import { formatElapsed } from './time.js'
  let { laps } = $props()
</script>

{#if laps.length > 0}
  <div class="laps">
    <table>
      <thead>
        <tr><th>#</th><th>Gap</th><th>Cumulative</th></tr>
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

<style>
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
