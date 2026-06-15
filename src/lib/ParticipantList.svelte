<script>
  import AddParticipant from './AddParticipant.svelte'
  import ParticipantCard from './ParticipantCard.svelte'

  let { participants, running, addParticipant, removeParticipant } = $props()
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
          {running}
          onRemove={() => removeParticipant(p.id)}
        />
      </li>
    {/each}
  </ul>
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
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }
</style>