<script>
  import { base } from '$app/paths'

  let { mode, onModeChange } = $props()

  const MODES = [
    {
      id: 'heat',
      label: 'Heat',
      desc: 'All participants start together and stop individually when they finish. Records one time per participant per heat.'
    },
    {
      id: 'lap',
      label: 'Lap',
      desc: 'A continuous timer runs while splits are recorded per participant at any moment. Each participant has a Lap and a Stop button.'
    },
    {
      id: 'interval',
      label: 'Interval',
      desc: 'Participants are split into pace groups, each with a rolling countdown (send-off). Tap a participant when they finish each rep.'
    },
    {
      id: 'rest',
      label: 'Rest',
      desc: 'All participants start together. Tap each participant when they finish a rep — a personal rest countdown begins, then their next rep starts automatically.'
    }
  ]

  let infoMode = $state(null)

  function toggleInfo(id, e) {
    e.stopPropagation()
    infoMode = infoMode === id ? null : id
  }
</script>

<svelte:window onclick={() => { infoMode = null }} />

<header>
  <div class="mode-toggle" role="group" aria-label="Timing mode">
    {#each MODES as m}
      <button
        class="toggle-btn"
        class:active={mode === m.id}
        onclick={() => onModeChange(m.id)}
      >
        {m.label}<span
          class="info-icon"
          role="button"
          tabindex="0"
          onclick={(e) => toggleInfo(m.id, e)}
          onkeydown={(e) => e.key === 'Enter' && toggleInfo(m.id, e)}
          aria-label="About {m.label} mode"
        >ⓘ</span>
      </button>
    {/each}
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

  {#if infoMode}
    {@const m = MODES.find(x => x.id === infoMode)}
    <div class="info-popover" role="tooltip" onclick={(e) => e.stopPropagation()}>
      <span class="info-mode-label">{m.label} mode</span>
      <p class="info-desc">{m.desc}</p>
    </div>
  {/if}
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
    position: relative;
  }

  .mode-toggle {
    display: flex;
    background: var(--bg);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }

  .toggle-btn {
    padding: 6px 12px;
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

  .info-icon {
    font-size: 10px;
    opacity: 0.55;
    vertical-align: super;
    margin-left: 2px;
    cursor: pointer;
    line-height: 1;
    user-select: none;
  }

  .toggle-btn.active .info-icon {
    opacity: 0.8;
  }

  .info-icon:hover {
    opacity: 1;
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

  .info-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 16px;
    right: 16px;
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    z-index: 200;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  }

  .info-mode-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
  }

  .info-desc {
    font-size: 13px;
    color: var(--text);
    margin-top: 4px;
    line-height: 1.55;
  }
</style>
