<script>
  import { base } from '$app/paths'
  let { title, backHref = '/', backLabel = 'Back', actions, children } = $props()
</script>

<div class="page">
  <header>
    <a href="{base}{backHref}" class="back-btn" aria-label={backLabel}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </a>
    <h1>{title}</h1>
    {#if actions}{@render actions()}{/if}
  </header>
  <main>
    {@render children()}
  </main>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  @media (min-width: 768px) {
    .page {
      max-width: 680px;
      margin: 0 auto;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
    }
  }

  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    height: 56px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: var(--surface-raised);
    color: var(--text);
  }

  h1 {
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
  }

  main {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
</style>