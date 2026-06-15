<script>
  let { addParticipant } = $props()
  let name = $state('')

  function submit() {
    if (name.trim()) {
      addParticipant(name)
      name = ''
    }
  }
</script>

<div class="add-row">
  <input
    type="text"
    placeholder="Participant name"
    bind:value={name}
    onkeydown={(e) => e.key === 'Enter' && submit()}
    maxlength="40"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="words"
  />
  <button class="add-btn" onclick={submit} disabled={!name.trim()}>Add</button>
</div>

<style>
  .add-row {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    height: 48px;
    padding: 0 14px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 16px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }

  input:focus {
    border-color: var(--accent);
  }

  input::placeholder {
    color: var(--text-muted);
  }

  .add-btn {
    height: 48px;
    padding: 0 20px;
    background: var(--accent);
    color: white;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 15px;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }

  .add-btn:disabled {
    opacity: 0.35;
  }

  .add-btn:active:not(:disabled) {
    opacity: 0.8;
  }
</style>