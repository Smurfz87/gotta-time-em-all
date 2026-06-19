<script>
  import { formatDuration } from './time.js'

  let { value = $bindable(), min = 5000 } = $props()

  const ITEM_H = 44

  let isOpen = $state(false)
  let minEl = $state(null)
  let secEl = $state(null)
  let editText = $state('')
  let syncing = false  // prevents scroll ↔ text update cycles

  $effect(() => {
    if (!isOpen || !minEl || !secEl) return
    const m = Math.floor(value / 60000)
    const s = Math.floor((value % 60000) / 1000)
    editText = formatDuration(value)
    minEl.scrollTop = m * ITEM_H
    secEl.scrollTop = s * ITEM_H
  })

  function open() {
    isOpen = true
  }

  // Text input → parse → sync drum columns
  function onTextInput(e) {
    const raw = e.target.value
    const parts = raw.trim().split(':')
    let m, s
    if (parts.length === 2) {
      m = Math.max(0, Math.min(99, parseInt(parts[0]) || 0))
      s = Math.max(0, Math.min(59, parseInt(parts[1]) || 0))
    } else {
      const total = parseInt(raw) || 0
      m = Math.min(99, Math.floor(total / 60))
      s = total % 60
    }
    syncing = true
    if (minEl) minEl.scrollTop = m * ITEM_H
    if (secEl) secEl.scrollTop = s * ITEM_H
    setTimeout(() => { syncing = false }, 150)
  }

  // Drum scroll → update text input
  function onDrumScroll() {
    if (syncing) return
    const m = Math.round((minEl?.scrollTop ?? 0) / ITEM_H)
    const s = Math.round((secEl?.scrollTop ?? 0) / ITEM_H)
    editText = formatDuration((m * 60 + s) * 1000)
  }

  function confirmPicker() {
    const m = Math.round((minEl?.scrollTop ?? 0) / ITEM_H)
    const s = Math.round((secEl?.scrollTop ?? 0) / ITEM_H)
    value = Math.max(min, (m * 60 + s) * 1000)
    isOpen = false
  }


</script>

<button class="display-btn" type="button" onclick={open}>
  {formatDuration(value)}
</button>

{#if isOpen}
  <div
    class="backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Set duration"
    onclick={(e) => { if (e.target === e.currentTarget) confirmPicker() }}
    onkeydown={(e) => { if (e.key === 'Escape') isOpen = false }}
  >
    <div class="sheet" onclick={(e) => e.stopPropagation()}>
      <div class="sheet-header">
        <button type="button" class="hdr-btn" onclick={() => (isOpen = false)}>Cancel</button>
        <input
          class="text-input"
          bind:value={editText}
          oninput={onTextInput}
          onkeydown={(e) => { if (e.key === 'Enter') confirmPicker() }}
          aria-label="Duration (m:ss)"
          inputmode="decimal"
        />
        <button type="button" class="hdr-btn hdr-btn--done" onclick={confirmPicker}>Done</button>
      </div>
      <div class="picker-body">
        <div class="selector-bar"></div>
        <div class="col-wrap">
          <div class="drum-col" bind:this={minEl} onscroll={onDrumScroll}>
            <div class="pad"></div>
            {#each Array.from({length: 100}, (_, i) => i) as m}
              <div class="drum-item">{m}</div>
            {/each}
            <div class="pad"></div>
          </div>
        </div>
        <span class="sep">:</span>
        <div class="col-wrap">
          <div class="drum-col" bind:this={secEl} onscroll={onDrumScroll}>
            <div class="pad"></div>
            {#each Array.from({length: 60}, (_, i) => i) as s}
              <div class="drum-item">{String(s).padStart(2, '0')}</div>
            {/each}
            <div class="pad"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .display-btn {
    min-width: 52px;
    background: var(--surface-raised);
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    text-align: center;
    padding: 4px 8px;
    height: 30px;
    cursor: pointer;
    outline: none;
  }

  .display-btn:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  /* Bottom-sheet backdrop */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .sheet {
    width: 100%;
    max-width: 480px;
    background: var(--surface);
    border-radius: 16px 16px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .sheet-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }

  .hdr-btn {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    padding: 4px 6px;
    flex-shrink: 0;
  }

  .hdr-btn--done {
    color: var(--accent);
    font-weight: 600;
  }

  .text-input {
    flex: 1;
    background: var(--surface-raised);
    border: none;
    border-radius: 8px;
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    text-align: center;
    padding: 6px 12px;
    outline: none;
    min-width: 0;
  }

  .text-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  /* Drum picker */
  .picker-body {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 220px;
    padding: 0 40px;
  }

  .selector-bar {
    position: absolute;
    left: 20px;
    right: 20px;
    top: 50%;
    height: 44px;
    transform: translateY(-50%);
    background: var(--surface-raised);
    border-radius: 10px;
    pointer-events: none;
    z-index: 0;
  }

  .col-wrap {
    position: relative;
    height: 220px;
    flex: 1;
    max-width: 120px;
    z-index: 1;
  }

  .col-wrap::before,
  .col-wrap::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 88px;
    pointer-events: none;
    z-index: 2;
  }

  .col-wrap::before {
    top: 0;
    background: linear-gradient(to bottom, var(--surface) 5%, transparent);
  }

  .col-wrap::after {
    bottom: 0;
    background: linear-gradient(to top, var(--surface) 5%, transparent);
  }

  .drum-col {
    height: 220px;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }

  .drum-col::-webkit-scrollbar { display: none; }

  .pad { height: 88px; }

  .drum-item {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    scroll-snap-align: center;
    user-select: none;
  }

  .sep {
    font-size: 28px;
    font-weight: 600;
    color: var(--text);
    padding: 0 8px;
    flex-shrink: 0;
    z-index: 1;
  }
</style>
