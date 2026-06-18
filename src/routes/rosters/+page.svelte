<script>
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import { dndzone } from 'svelte-dnd-action'
  import PageShell from '$lib/PageShell.svelte'
  import { readRosters, writeRosters, readSession, writeSession } from '$lib/storage.js'
  import { getInitials } from '$lib/utils.js'

  let rosters = $state(readRosters())

  let showModal = $state(false)
  let editingId = $state(null)
  let modalName = $state('')
  let modalParticipants = $state([])
  let addName = $state('')

  const currentParticipants = readSession().participants ?? []

  function participantPreview(participants) {
    if (participants.length === 0) return 'No participants'
    const names = participants.slice(0, 3).map(p => p.name)
    const rest = participants.length - 3
    return names.join(' · ') + (rest > 0 ? ` +${rest}` : '')
  }

  function openCreate() {
    editingId = null
    modalName = ''
    modalParticipants = []
    addName = ''
    showModal = true
  }

  function openSaveCurrent() {
    editingId = null
    modalName = ''
    modalParticipants = currentParticipants.map(p => ({ id: crypto.randomUUID(), name: p.name, initials: p.initials }))
    addName = ''
    showModal = true
  }

  function openEdit(roster) {
    editingId = roster.id
    modalName = roster.name
    modalParticipants = roster.participants.map(p => ({ ...p }))
    addName = ''
    showModal = true
  }

  function addToModal() {
    const trimmed = addName.trim()
    if (!trimmed) return
    modalParticipants.push({ id: crypto.randomUUID(), name: trimmed, initials: getInitials(trimmed) })
    addName = ''
  }

  function removeFromModal(id) {
    modalParticipants = modalParticipants.filter(p => p.id !== id)
  }

  function saveModal() {
    const name = modalName.trim()
    if (!name) return
    const participants = $state.snapshot(modalParticipants)
    if (editingId) {
      rosters = rosters.map(r => r.id === editingId ? { ...r, name, participants } : r)
    } else {
      rosters = [...rosters, { id: crypto.randomUUID(), name, participants }]
    }
    writeRosters($state.snapshot(rosters))
    showModal = false
  }

  function deleteRoster(id, name) {
    if (!confirm(`Delete "${name}"?`)) return
    rosters = rosters.filter(r => r.id !== id)
    writeRosters($state.snapshot(rosters))
  }

  function loadRoster(roster) {
    const session = readSession()
    const hasInProgress = (session.pendingHeats?.length > 0) ||
      (session.lapState?.phase && session.lapState.phase !== 'idle')

    if (hasInProgress) {
      if (!confirm(`Loading "${roster.name}" will discard uncommitted session results. Continue?`)) return
    }

    session.participants = roster.participants.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      initials: getInitials(p.name)
    }))
    session.pendingHeats = []
    session.lapState = null
    writeSession(session)
    goto(base + '/')
  }
</script>

<PageShell title="Rosters" backHref="/settings" backLabel="Back to settings">
  <div class="content">

    {#if currentParticipants.length > 0}
      <div class="section">
        <div class="section-title">Current session</div>
        <button class="row btn-row" onclick={openSaveCurrent}>
          <div class="row-label">
            <span class="row-title">Save current as Roster</span>
            <span class="row-desc">{participantPreview(currentParticipants)}</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>
      </div>
    {/if}

    <div class="section">
      <div class="section-title">Saved rosters</div>

      {#if rosters.length === 0}
        <p class="empty">No saved rosters yet.</p>
      {:else}
        {#each rosters as roster, i}
          {#if i > 0}<div class="row-divider"></div>{/if}
          <div class="row roster-row">
            <div class="row-label">
              <span class="row-title">{roster.name}</span>
              <span class="row-desc">{participantPreview(roster.participants)}</span>
            </div>
            <div class="row-actions">
              <button class="action-btn load-btn" onclick={() => loadRoster(roster)}>Load</button>
              <button class="action-btn icon-btn" onclick={() => openEdit(roster)} aria-label="Edit {roster.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn icon-btn danger-btn" onclick={() => deleteRoster(roster.id, roster.name)} aria-label="Delete {roster.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <button class="new-btn" onclick={openCreate}>New empty Roster</button>

  </div>
</PageShell>

{#if showModal}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label={editingId ? 'Edit roster' : 'New roster'}
    tabindex="-1"
    onclick={(e) => { if (e.target === e.currentTarget) showModal = false }}
    onkeydown={(e) => { if (e.key === 'Escape') showModal = false }}
  >
    <div class="modal">
      <div class="modal-header">
        <h2>{editingId ? 'Edit Roster' : 'New Roster'}</h2>
        <button class="modal-close" onclick={() => showModal = false} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <input
          class="name-input"
          type="text"
          placeholder="Roster name"
          bind:value={modalName}
          onkeydown={(e) => e.key === 'Enter' && saveModal()}
          maxlength="40"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="words"
        />

        {#if modalParticipants.length > 0}
          <ul
            class="participant-list"
            use:dndzone={{ items: modalParticipants, flipDurationMs: 150, type: 'roster-modal' }}
            onconsider={(e) => { modalParticipants = e.detail.items }}
            onfinalize={(e) => { modalParticipants = e.detail.items.map(({ id, name, initials }) => ({ id, name, initials })) }}
          >
            {#each modalParticipants as p (p.id)}
              <li class="participant-item">
                <div class="drag-handle" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
                    <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
                    <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
                  </svg>
                </div>
                <span class="p-name">{p.name}</span>
                <button class="remove-btn" onclick={() => removeFromModal(p.id)} aria-label="Remove {p.name}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </li>
            {/each}
          </ul>
        {/if}

        <div class="add-row">
          <input
            type="text"
            placeholder="Add participant"
            bind:value={addName}
            onkeydown={(e) => e.key === 'Enter' && addToModal()}
            maxlength="40"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="words"
          />
          <button class="add-btn" onclick={addToModal} disabled={!addName.trim()}>Add</button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" onclick={() => showModal = false}>Cancel</button>
        <button class="save-btn" onclick={saveModal} disabled={!modalName.trim()}>Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .section-title {
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    gap: 12px;
  }

  .btn-row {
    background: transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 0.15s;
  }

  .btn-row:hover { background: var(--surface-raised); }

  .row-divider {
    height: 1px;
    background: var(--border);
    margin: 0 16px;
  }

  .row-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .row-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text);
  }

  .row-desc {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .roster-row { gap: 8px; }

  .row-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s, color 0.15s;
  }

  .load-btn {
    padding: 0 12px;
    background: var(--accent);
    color: white;
  }

  .load-btn:hover { background: var(--accent-hover); }

  .icon-btn {
    width: 32px;
    background: transparent;
    color: var(--text-muted);
  }

  .icon-btn:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  .danger-btn:hover {
    background: color-mix(in srgb, var(--danger) 15%, transparent);
    color: var(--danger);
  }

  .empty {
    padding: 16px;
    font-size: 14px;
    color: var(--text-muted);
  }

  .new-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    transition: background 0.15s, color 0.15s;
  }

  .new-btn:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 100;
    padding: 0;
  }

  @media (min-height: 600px) {
    .modal-backdrop {
      align-items: center;
      padding: 24px;
    }
  }

  .modal {
    background: var(--surface);
    border-radius: var(--radius) var(--radius) 0 0;
    width: 100%;
    max-height: 85dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  @media (min-height: 600px) {
    .modal {
      border-radius: var(--radius);
      max-width: 400px;
      max-height: 80dvh;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    transition: background 0.15s;
  }

  .modal-close:hover { background: var(--surface-raised); }

  .modal-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
  }

  .name-input {
    width: 100%;
    height: 48px;
    padding: 0 14px;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 16px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }

  .name-input:focus { border-color: var(--accent); }
  .name-input::placeholder { color: var(--text-muted); }

  .participant-list {
    list-style: none;
    background: var(--bg);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .participant-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }

  .participant-item .drag-handle {
    display: flex;
    align-items: center;
    color: var(--text-muted);
    opacity: 0.4;
    cursor: grab;
    flex-shrink: 0;
    touch-action: none;
  }

  .participant-item .drag-handle:active { cursor: grabbing; }

  .participant-item:last-child { border-bottom: none; }

  .p-name {
    flex: 1;
    font-size: 14px;
    color: var(--text);
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background: color-mix(in srgb, var(--danger) 15%, transparent);
    color: var(--danger);
  }

  .add-row {
    display: flex;
    gap: 8px;
  }

  .add-row input {
    flex: 1;
    height: 44px;
    padding: 0 12px;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 15px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }

  .add-row input:focus { border-color: var(--accent); }
  .add-row input::placeholder { color: var(--text-muted); }

  .add-btn {
    height: 44px;
    padding: 0 16px;
    background: var(--surface-raised);
    color: var(--text);
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }

  .add-btn:disabled { opacity: 0.35; }

  .modal-footer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .cancel-btn {
    flex: 1;
    height: 44px;
    border-radius: var(--radius);
    background: var(--surface-raised);
    color: var(--text);
    font-size: 15px;
    font-weight: 600;
    transition: background 0.15s;
  }

  .cancel-btn:hover { background: var(--border); }

  .save-btn {
    flex: 1;
    height: 44px;
    border-radius: var(--radius);
    background: var(--accent);
    color: white;
    font-size: 15px;
    font-weight: 600;
    transition: background 0.15s, opacity 0.15s;
  }

  .save-btn:hover:not(:disabled) { background: var(--accent-hover); }
  .save-btn:disabled { opacity: 0.35; }
</style>