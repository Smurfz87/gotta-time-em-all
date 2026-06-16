<script>
  import { formatElapsed } from './time.js'

  let { mode, onModeChange, sessionElapsed, heatPhase } = $props()
</script>

<header>
  <div class="mode-toggle" role="group" aria-label="Timing mode">
    <button
      class="toggle-btn"
      class:active={mode === 'heat'}
      onclick={() => onModeChange('heat')}
    >Heat</button>
    <button
      class="toggle-btn"
      class:active={mode === 'lap'}
      onclick={() => onModeChange('lap')}
    >Lap</button>
  </div>
  <div class="session-clock" class:active={heatPhase !== 'idle'} aria-label="Session time" aria-live="off">
    {formatElapsed(sessionElapsed)}
  </div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 56px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .mode-toggle {
    display: flex;
    background: var(--bg);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }

  .toggle-btn {
    padding: 6px 18px;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 600;
    min-height: 36px;
    transition: background 0.15s, color 0.15s;
  }

  .toggle-btn.active {
    background: var(--accent);
    color: white;
  }

.session-clock {
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    color: var(--text-muted);
    transition: color 0.2s;
  }

  .session-clock.active {
    color: var(--text);
  }
</style>