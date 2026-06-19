<script>
  import AddParticipant from './AddParticipant.svelte'
  import { formatDuration } from './time.js'

  let { intervalConfig, participants, addParticipant } = $props()

  let pickerOpenFor = $state(null)

  let unassigned = $derived(
    participants.filter(p =>
      !intervalConfig.paceGroups.some(g => g.participantIds.includes(p.id))
    )
  )

  let participantMap = $derived(
    Object.fromEntries(participants.map(p => [p.id, p]))
  )

  let bufferSeconds = $state(Math.round((intervalConfig.overflowBuffer ?? 30000) / 1000))

  $effect(() => {
    intervalConfig.overflowBuffer = Math.max(1, bufferSeconds || 30) * 1000
  })

  function addGroup() {
    intervalConfig.paceGroups.push({
      id: crypto.randomUUID(),
      name: `Group ${intervalConfig.paceGroups.length + 1}`,
      sendOff: 60000,
      participantIds: []
    })
  }

  function deleteGroup(groupId) {
    const group = intervalConfig.paceGroups.find(g => g.id === groupId)
    if (!group) return
    if (group.participantIds.length > 0 &&
        !confirm(`Remove "${group.name}" and unassign its ${group.participantIds.length} participant(s)?`)) return
    intervalConfig.paceGroups = intervalConfig.paceGroups.filter(g => g.id !== groupId)
    if (pickerOpenFor === groupId) pickerOpenFor = null
  }

  function assignParticipant(groupId, participantId) {
    const group = intervalConfig.paceGroups.find(g => g.id === groupId)
    if (!group || group.participantIds.includes(participantId)) return
    group.participantIds.push(participantId)
    pickerOpenFor = null
  }

  function unassignParticipant(groupId, participantId) {
    const group = intervalConfig.paceGroups.find(g => g.id === groupId)
    if (!group) return
    group.participantIds = group.participantIds.filter(id => id !== participantId)
  }

  function parseSendOff(str) {
    const parts = str.trim().split(':')
    if (parts.length === 2) {
      const m = parseInt(parts[0]) || 0
      const s = Math.min(59, parseInt(parts[1]) || 0)
      return Math.max(5000, (m * 60 + s) * 1000)
    }
    return Math.max(5000, (parseInt(str) || 0) * 1000)
  }

  function handleSendOffBlur(group, e) {
    group.sendOff = parseSendOff(e.target.value)
    e.target.value = formatDuration(group.sendOff)
  }

  function handleRepCountInput(e) {
    const n = parseInt(e.target.value)
    intervalConfig.repCount = n > 0 ? n : null
  }
</script>

<AddParticipant {addParticipant} />

<div class="setup">
  <div class="section-header">
    <span class="section-title">Pace groups</span>
    <button class="add-group-btn" onclick={addGroup}>+ Add group</button>
  </div>

  {#if intervalConfig.paceGroups.length === 0}
    <div class="empty-groups">Add a group to assign participants to</div>
  {/if}

  {#each intervalConfig.paceGroups as group (group.id)}
    <div class="group-card">
      <div class="group-header">
        <input
          class="group-name-input"
          value={group.name}
          oninput={(e) => { group.name = e.target.value }}
          aria-label="Group name"
        />
        <input
          class="sendoff-input"
          value={formatDuration(group.sendOff)}
          onblur={(e) => handleSendOffBlur(group, e)}
          aria-label="Send-off (mm:ss)"
          title="Send-off time in mm:ss"
        />
        <button class="delete-group-btn" onclick={() => deleteGroup(group.id)} aria-label="Delete {group.name}">×</button>
      </div>

      <div class="group-chips">
        {#each group.participantIds as pId (pId)}
          {#if participantMap[pId]}
            <div class="chip">
              <span class="chip-name">{participantMap[pId].name}</span>
              <button class="chip-remove" onclick={() => unassignParticipant(group.id, pId)} aria-label="Remove {participantMap[pId].name}">×</button>
            </div>
          {/if}
        {/each}

        {#if pickerOpenFor === group.id}
          <div class="picker">
            {#each unassigned as p (p.id)}
              <button class="picker-option" onclick={() => assignParticipant(group.id, p.id)}>{p.name}</button>
            {/each}
            <button class="picker-cancel" onclick={() => pickerOpenFor = null}>Cancel</button>
          </div>
        {:else if unassigned.length > 0}
          <button class="add-to-group-btn" onclick={() => pickerOpenFor = group.id}>+ Add</button>
        {/if}
      </div>
    </div>
  {/each}

  {#if unassigned.length > 0}
    <div class="unassigned-warning">
      <span class="warning-icon">⚠</span>
      <span class="warning-label">Unassigned:</span>
      {#each unassigned as p (p.id)}
        <span class="unassigned-name">{p.name}</span>
      {/each}
    </div>
  {/if}

  <div class="config-section">
    <div class="config-row">
      <label class="config-label" for="rep-count">Reps</label>
      <input
        id="rep-count"
        class="config-input short"
        type="number"
        placeholder="∞"
        value={intervalConfig.repCount ?? ''}
        oninput={handleRepCountInput}
      />
    </div>

    <div class="config-row column">
      <span class="config-label">When overdue</span>
      <label class="radio-label">
        <input type="radio" bind:group={intervalConfig.overflowBehavior} value="rejoin" />
        Rejoin group clock
      </label>
      <label class="radio-label">
        <input type="radio" bind:group={intervalConfig.overflowBehavior} value="reset" />
        Reset full send-off
      </label>
      <label class="radio-label">
        <input type="radio" bind:group={intervalConfig.overflowBehavior} value="reset+buffer" />
        Reset + buffer
        {#if intervalConfig.overflowBehavior === 'reset+buffer'}
          <input class="config-input short" type="number" min="1" bind:value={bufferSeconds} />
          <span>s</span>
        {/if}
      </label>
    </div>
  </div>
</div>

<style>
  .setup {
    padding: 4px 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 4px 8px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .add-group-btn {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    background: transparent;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .add-group-btn:active { background: var(--surface-raised); }

  .empty-groups {
    font-size: 14px;
    color: var(--text-muted);
    padding: 12px 4px;
  }

  .group-card {
    background: var(--surface);
    border-radius: 8px;
    margin-bottom: 6px;
    overflow: hidden;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px 0 12px;
    height: 44px;
    border-bottom: 1px solid var(--border);
  }

  .group-name-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    outline: none;
  }

  .group-name-input:focus {
    color: var(--accent);
  }

  .sendoff-input {
    width: 52px;
    background: var(--surface-raised);
    border-radius: 4px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    text-align: center;
    padding: 3px 4px;
    outline: none;
  }

  .sendoff-input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .delete-group-btn {
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
  }

  .delete-group-btn:hover { color: var(--danger); }

  .group-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 12px;
    min-height: 44px;
    align-items: center;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--surface-raised);
    border-radius: 20px;
    padding: 3px 4px 3px 10px;
    font-size: 13px;
  }

  .chip-name {
    font-weight: 500;
    color: var(--text);
  }

  .chip-remove {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chip-remove:hover { color: var(--danger); }

  .add-to-group-btn {
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    background: transparent;
    border: 1.5px dashed var(--accent);
    border-radius: 20px;
    padding: 3px 10px;
    opacity: 0.7;
  }

  .add-to-group-btn:active { opacity: 1; }

  .picker {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .picker-option {
    font-size: 13px;
    font-weight: 500;
    background: var(--accent);
    color: white;
    border-radius: 20px;
    padding: 4px 12px;
  }

  .picker-cancel {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--surface-raised);
    border-radius: 20px;
    padding: 4px 12px;
  }

  .unassigned-warning {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    background: color-mix(in srgb, var(--warning, #f59e0b) 12%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--warning, #f59e0b) 40%, transparent);
    border-radius: 8px;
    padding: 10px 12px;
    margin: 6px 0;
    font-size: 13px;
  }

  .warning-icon { font-size: 15px; }

  .warning-label {
    font-weight: 600;
    color: var(--text);
  }

  .unassigned-name {
    color: var(--text-muted);
  }

  .config-section {
    background: var(--surface);
    border-radius: 8px;
    margin-top: 6px;
    overflow: hidden;
  }

  .config-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
  }

  .config-row:last-child { border-bottom: none; }

  .config-row.column {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .config-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    flex-shrink: 0;
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

  .config-input.short { width: 72px; text-align: center; }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text);
    cursor: pointer;
  }

  .radio-label input[type="radio"] {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
</style>
