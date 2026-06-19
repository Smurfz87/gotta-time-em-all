<script>
  import { formatDuration } from './time.js'

  let { value = $bindable(), min = 5000 } = $props()

  const ITEM_H = 44  // px per drum item

  let isOpen = $state(false)
  let isEditing = $state(false)
  let coarse = $state(false)
  let minEl = $state(null)
  let secEl = $state(null)
  let editText = $state('')

  $effect(() => {
    coarse = window.matchMedia('(pointer: coarse)').matches
  })

  // Scroll columns to current value whenever picker opens or refs bind
  $effect(() => {
    if (!isOpen || !minEl || !secEl) return
    const m = Math.floor(value / 60000)
    const s = Math.floor((value % 60000) / 1000)
    minEl.scrollTop = m * ITEM_H
    secEl.scrollTop = s * ITEM_H
  })

  function handleClick() {
    if (coarse) {
      isOpen = true
    } else {
      editText = formatDuration(value)
      isEditing = true
    }
  }

  function confirmPicker() {
    const m = Math.round((minEl?.scrollTop ?? 0) / ITEM_H)
    const s = Math.round((secEl?.scrollTop ?? 0) / ITEM_H)
    value = Math.max(min, (m * 60 + s) * 1000)
    isOpen = false
  }

  function commitEdit() {
    const parts = editText.trim().split(':')
    let ms
    if (parts.length === 2) {
      ms = ((parseInt(parts[0]) || 0) * 60 + Math.min(59, parseInt(parts[1]) || 0)) * 1000
    } else {
      ms = (parseInt(editText) || 0) * 1000
    }
    value = Math.max(min, ms)
    isEditing = false
  }

  function focusAndSelect(node) {
    node.focus()
    node.select()
  }
</script>

{#if isEditing}
  <input
    class="display-btn"
    bind:value={editText}
    onblur={commitEdit}
    onkeydown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    use:focusAndSelect
  />
{:else}
  <button class="display-btn" type="button" onclick={handleClick}>
    {formatDuration(value)}
  </button>
{/if}

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
        <button type="button" class="hdr-btn hdr-btn--done" onclick={confirmPicker}>Done</button>
      </div>
      <div class="picker-body">
        <div class="selector-bar"></div>
        <div class="col-wrap">
          <div class="drum-col" bind:this={minEl}>
            <div class="pad"></div>
            {#each Array.from({length: 100}, (_, i) => i) as m}
              <div class="drum-item">{m}</div>
            {/each}
            <div class="pad"></div>
          </div>
        </div>
        <span class="sep">:</span>
        <div class="col-wrap">
          <div class="drum-col" bind:this={secEl}>
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
    box-sizing: border-box;
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
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
  }

  .hdr-btn {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    padding: 4px 8px;
  }

  .hdr-btn--done {
    color: var(--accent);
    font-weight: 600;
  }

  /* Drum picker */
  .picker-body {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 220px; /* 5 × ITEM_H */
    padding: 0 40px;
  }

  /* Highlight bar behind centre row */
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

  /* Fade masks */
  .col-wrap::before,
  .col-wrap::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 88px; /* 2 × ITEM_H */
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

  /* Top + bottom padding so item 0 / last item can centre */
  .pad { height: 88px; } /* 2 × ITEM_H */

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
