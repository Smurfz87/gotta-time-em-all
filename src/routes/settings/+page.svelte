<script>
  import { base } from '$app/paths'

  const SETTINGS_KEY = 'gtta:settings'

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? { vibrateOnLap: false, ...JSON.parse(raw) } : { vibrateOnLap: false }
    } catch {}
    return { vibrateOnLap: false }
  }

  let settings = $state(loadSettings())
  let canVibrate = $state(false)

  $effect(() => {
    canVibrate = typeof navigator.vibrate === 'function'
  })

  $effect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify($state.snapshot(settings)))
  })
</script>

<div class="page">
  <header>
    <a href="{base}/" class="back-btn" aria-label="Back to timer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </a>
    <h1>Settings</h1>
  </header>

  <main>
    {#if canVibrate}
      <div class="section">
        <label class="setting-row">
          <div class="setting-label">
            <span class="setting-title">Vibrate on lap</span>
            <span class="setting-desc">50ms pulse when recording a lap</span>
          </div>
          <div class="toggle" class:on={settings.vibrateOnLap}>
            <input type="checkbox" bind:checked={settings.vibrateOnLap} aria-label="Vibrate on lap" />
            <span class="track"><span class="thumb"></span></span>
          </div>
        </label>
      </div>
    {:else}
      <p class="no-settings">No configurable settings for this device.</p>
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
    padding: 16px;
    overflow-y: auto;
  }

  .section {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    gap: 16px;
    cursor: pointer;
  }

  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .setting-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
  }

  .setting-desc {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* Toggle switch */
  .toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .track {
    display: block;
    width: 48px;
    height: 28px;
    border-radius: 14px;
    background: var(--surface-raised);
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toggle.on .track {
    background: var(--accent);
  }

  .thumb {
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    top: 3px;
    left: 3px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .toggle.on .thumb {
    transform: translateX(20px);
  }

  .no-settings {
    color: var(--text-muted);
    font-size: 14px;
    text-align: center;
    padding: 40px 0;
  }
</style>