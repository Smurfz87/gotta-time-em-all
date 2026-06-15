<div class="empty-state">
  <span class="icon" aria-hidden="true">⏱</span>
  <p>No participants yet</p>
  <p class="hint">Add a name to get started</p>
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 10px;
    color: var(--text-muted);
    text-align: center;
    padding: 32px;
    min-height: 200px;
  }

  .icon {
    font-size: 40px;
    line-height: 1;
    opacity: 0.4;
  }

  p {
    font-size: 16px;
    font-weight: 500;
  }

  .hint {
    font-size: 14px;
    opacity: 0.6;
  }
</style>