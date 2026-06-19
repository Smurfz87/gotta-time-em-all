<script>
  import { drumDrag } from './drumDrag.js'

  let { value = $bindable() } = $props()
  // value: null (∞, unlimited) or integer 1–100

  const ITEM_H = 44
  const MAX = 100

  let isOpen = $state(false)
  let colEl = $state(null)
  let editText = $state('')
  let syncing = false

  function posFromValue(v) {
    return v == null ? 0 : Math.max(1, Math.min(MAX, v))
  }

  function valueFromPos(pos) {
    return pos === 0 ? null : Math.max(1, Math.min(MAX, Math.round(pos)))
  }

  function displayText(v) {
    return v == null ? '∞' : String(v)
  }

  $effect(() => {
    if (!isOpen || !colEl) return
    editText = displayText(value)
    colEl.scrollTop = posFromValue(value) * ITEM_H
  })

  function open() {
    isOpen = true
  }

  // Text input → sync drum column
  function onTextInput(e) {
    const raw = e.target.value.trim()
    let pos
    if (raw === '∞' || raw === '' || raw.toLowerCase() === 'inf') {
      pos = 0
    } else {
      const n = parseInt(raw) || 0
      pos = n > 0 ? Math.min(MAX, n) : 0
    }
    syncing = true
    if (colEl) colEl.scrollTop = pos * ITEM_H
    setTimeout(() => { syncing = false }, 150)
  }

  // Drum scroll → update text input
  function onColScroll() {
    if (syncing) return
    const pos = Math.round((colEl?.scrollTop ?? 0) / ITEM_H)
    editText = pos === 0 ? '∞' : String(pos)
  }

  function confirmPicker() {
    const pos = Math.round((colEl?.scrollTop ?? 0) / ITEM_H)
    value = valueFromPos(pos)
    isOpen = false
  }
</script>

<button class="display-btn" type="button" onclick={open}>
  {displayText(value)}
</button>

{#if isOpen}
  <div
    class="backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Set rep count"
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
          aria-label="Rep count (∞ for unlimited)"
          inputmode="numeric"
        />
        <button type="button" class="hdr-btn hdr-btn--done" onclick={confirmPicker}>Done</button>
      </div>
      <div class="picker-body">
        <div class="selector-bar"></div>
        <div class="col-wrap">
          <div class="drum-col" bind:this={colEl} onscroll={onColScroll} use:drumDrag>
            <div class="pad"></div>
            <div class="drum-item">∞</div>
            {#each Array.from({length: MAX}, (_, i) => i + 1) as n}
              <div class="drum-item">{n}</div>
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
    width: 160px;
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
    cursor: grab;
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
</style>
