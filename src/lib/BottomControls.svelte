<div class="controls">
  <button class="btn btn-primary" disabled>Start all</button>
  <button class="btn btn-secondary">New session</button>
  <button class="btn btn-ghost-danger">Clear roster</button>
</div>

<style>
  .controls {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .btn {
    flex: 1;
    min-height: 48px;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    transition: opacity 0.15s, background 0.15s;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:disabled {
    opacity: 0.35;
  }

  .btn-secondary {
    background: var(--surface-raised);
    color: var(--text);
  }

  .btn-secondary:active {
    opacity: 0.7;
  }

  .btn-ghost-danger {
    background: transparent;
    color: var(--danger);
    border: 1.5px solid var(--danger);
    opacity: 0.8;
  }

  .btn-ghost-danger:active {
    opacity: 1;
  }
</style>