<script>
  import AddParticipant from './AddParticipant.svelte'
  import DurationPicker from './DurationPicker.svelte'
  import { avatarColor } from './utils.js'

  let { restConfig, participants, addParticipant, removeParticipant } = $props()

  function handleRepCountInput(e) {
    const n = parseInt(e.target.value)
    restConfig.repCount = n > 0 ? n : null
  }
</script>

<AddParticipant {addParticipant} />

<div class="setup">
  <div class="config-section">
    <div class="config-row">
      <span class="config-label">Rest duration</span>
      <DurationPicker bind:value={restConfig.restDuration} min={5000} />
    </div>
    <div class="config-row">
      <label class="config-label" for="rep-count">Reps</label>
      <input
        id="rep-count"
        class="config-input short"
        type="number"
        placeholder="∞"
        value={restConfig.repCount ?? ''}
        oninput={handleRepCountInput}
        aria-label="Rep count (blank for unlimited)"
      />
    </div>
  </div>

  {#if participants.length > 0}
    <div class="section-header">
      <span class="section-title">Participants</span>
    </div>
    <div class="participant-list">
      {#each participants as p (p.id)}
        <div class="p-row">
          <div class="avatar" style:background={avatarColor(p.name)} aria-hidden="true">
            {p.initials}
          </div>
          <span class="p-name">{p.name}</span>
          <button class="remove-btn" onclick={() => removeParticipant(p.id)} aria-label="Remove {p.name}">×</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .setup {
    padding: 4px 0;
  }

  /* --- Config section --- */
  .config-section {
    background: var(--surface);
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .config-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }

  .config-row:last-child {
    border-bottom: none;
  }

  .config-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    flex: 1;
  }

  .config-input {
    background: var(--surface-raised);
    border: none;
    border-radius: 6px;
    font-size: 14px;
    color: var(--text);
    padding: 6px 10px;
    outline: none;
  }

  .config-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .config-input.short {
    width: 72px;
    text-align: center;
  }

  /* --- Participant list --- */
  .section-header {
    padding: 12px 4px 6px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .participant-list {
    background: var(--surface);
    border-radius: 8px;
    overflow: hidden;
  }

  .p-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px 0 14px;
    height: 44px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  }

  .p-row:last-child {
    border-bottom: none;
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    user-select: none;
  }

  .p-name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }

  .remove-btn:hover {
    background: var(--surface-raised);
    color: var(--danger);
  }
</style>