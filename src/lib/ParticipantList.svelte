<script>
  import AddParticipant from './AddParticipant.svelte'
  import ParticipantCard from './ParticipantCard.svelte'
  import HeatResultsGrid from './HeatResultsGrid.svelte'

  let { participants, history, mode, heatPhase, participantTimers, now, addParticipant, removeParticipant, stopParticipant, recordLap } = $props()
</script>

<AddParticipant {addParticipant} />

{#if participants.length === 0}
  <div class="empty-state">
    <span class="icon" aria-hidden="true">⏱</span>
    <p>No participants yet</p>
  </div>
{:else}
  <ul class="cards" aria-label="Participants">
    {#each participants as p (p.id)}
      <li>
        <ParticipantCard
          participant={p}
          {mode}
          {heatPhase}
          timer={participantTimers[p.id] ?? null}
          {now}
          onRemove={() => removeParticipant(p.id)}
          onStop={() => stopParticipant(p.id)}
          onLap={() => recordLap(p.id)}
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
