<script>
  import { dndzone } from 'svelte-dnd-action'
  import AddParticipant from './AddParticipant.svelte'
  import ParticipantCard from './ParticipantCard.svelte'
  import HeatResultsGrid from './HeatResultsGrid.svelte'

  let { participants, history, mode, heatPhase, participantTimers, intervalParticipants, now, addParticipant, removeParticipant, stopParticipant, recordLap, recordIntervalRep, vibrateOnLap, reorderParticipants } = $props()

  let items = $state([...participants])
  $effect(() => { items = [...participants] })

  let expandedIds = $state({})
  let flashKeys = $state({})

  $effect(() => {
    if (heatPhase === 'idle') {
      expandedIds = {}
      flashKeys = {}
    }
  })

  function toggleExpand(id) {
    expandedIds[id] = !expandedIds[id]
  }

  function expandAll() {
    for (const p of participants) expandedIds[p.id] = true
  }

  function collapseAll() {
    for (const p of participants) expandedIds[p.id] = false
  }

  function handleLap(id) {
    recordLap(id)
    flashKeys[id] = (flashKeys[id] ?? 0) + 1
    if (vibrateOnLap) try { navigator.vibrate(50) } catch {}
  }

  function handleConsider(e) { items = e.detail.items }
  function handleFinalize(e) {
    items = e.detail.items
    reorderParticipants(items.map(({ id, name, initials }) => ({ id, name, initials })))
  }
</script>

<AddParticipant {addParticipant} />

{#if mode === 'lap'}
  <div class="lap-controls">
    <button class="lap-ctrl-btn" onclick={expandAll}>Show all</button>
    <button class="lap-ctrl-btn" onclick={collapseAll}>Hide all</button>
  </div>
{/if}

{#if participants.length === 0}
  <div class="empty-state">
    <span class="icon" aria-hidden="true">⏱</span>
    <p>No participants yet</p>
  </div>
{:else}
  <ul
    class="cards"
    aria-label="Participants"
    use:dndzone={{ items, flipDurationMs: 150, type: 'participants' }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
  >
    {#each items as p (p.id)}
      <li>
        <ParticipantCard
          participant={p}
          {mode}
          {heatPhase}
          timer={participantTimers[p.id] ?? null}
          intervalTimer={intervalParticipants?.[p.id] ?? null}
          {now}
          expanded={expandedIds[p.id] ?? false}
          flashKey={flashKeys[p.id] ?? 0}
          onToggleExpand={() => toggleExpand(p.id)}
          onRemove={() => removeParticipant(p.id)}
          onStop={() => stopParticipant(p.id)}
          onLap={() => handleLap(p.id)}
          onRep={() => recordIntervalRep(p.id)}
        />
      </li>
    {/each}
  </ul>
{/if}

{#if mode === 'heat' && history.length > 0}
  <HeatResultsGrid {history} {participants} />
{/if}

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    text-align: center;
    padding: 40px 32px;
  }

  .icon {
    font-size: 36px;
    opacity: 0.4;
    margin-top: 16px;
  }

  p {
    font-size: 15px;
  }

  .lap-controls {
    display: flex;
    gap: 6px;
    margin: 8px 0 4px;
    justify-content: flex-end;
  }

  .lap-ctrl-btn {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    background: transparent;
    padding: 4px 10px;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .lap-ctrl-btn:active {
    background: var(--surface-raised);
  }

  .cards {
    list-style: none;
    display: grid;
    grid-template-columns: 1fr;
    align-items: start;
    gap: 4px;
    margin-top: 8px;
  }

  .cards > li {
    min-width: 0;
  }

  @media (min-width: 600px) {
    .cards {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>