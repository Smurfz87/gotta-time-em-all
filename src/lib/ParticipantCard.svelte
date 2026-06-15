<script>
  let { participant, running, onRemove } = $props()

  const AVATAR_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
    '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
  ]

  function avatarColor(name) {
    let hash = 0
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }

  let color = $derived(avatarColor(participant.name))
</script>

<div class="card">
  <div class="avatar" style:background={color} aria-hidden="true">
    {participant.initials}
  </div>
  <span class="name">{participant.name}</span>
  <button
    class="remove-btn"
    disabled={running}
    onclick={onRemove}
    aria-label="Remove {participant.name}"
    title={running ? 'Stop the session before removing' : 'Remove participant'}
  >×</button>
</div>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface);
    border-radius: var(--radius);
    min-height: 64px;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    user-select: none;
  }

  .name {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    font-size: 22px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }

  .remove-btn:hover:not(:disabled) {
    background: var(--surface-raised);
    color: var(--danger);
  }

  .remove-btn:disabled {
    opacity: 0.25;
  }
</style>