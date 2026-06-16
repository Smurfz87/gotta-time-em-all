<script>
  import { formatElapsed } from './time.js'
  import { base } from '$app/paths'

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
  <div class="nav-icons">
    <a href="{base}/history" class="icon-link" aria-label="History">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="9" y1="18" x2="20" y2="18"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="18" x2="4.01" y2="18"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="6" x2="4.01" y2="6"/>
      </svg>
    </a>
    <a href="{base}/settings" class="icon-link" aria-label="Settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </a>
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

  .nav-icons {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
  }

  .icon-link:hover {
    background: var(--surface-raised);
    color: var(--text);
  }
</style>