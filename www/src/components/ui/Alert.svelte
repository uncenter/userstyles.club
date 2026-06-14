<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'error' | 'success' | 'warning' | 'info';
    children: Snippet;
  }

  let { variant = 'error', children }: Props = $props();

  const icons: Record<string, string> = {
    error: '✕',
    success: '✓',
    warning: '⚠',
    info: 'ℹ',
  };
</script>

<div class="alert alert-{variant}" role="alert">
  <em class="alert-icon" aria-hidden="true">{icons[variant]}</em>
  <div class="alert-content">
    {@render children()}
  </div>
</div>

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    border: 2px solid currentColor;
    border-left-width: 5px;

    .alert-icon {
      flex-shrink: 0;
      font-weight: 700;
      margin-top: 1px;
      font-style: normal;
    }
    .alert-content {
      flex: 1;
    }
  }

  .alert-error {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .alert-success {
    background: var(--mint);
    color: var(--mint-vivid);
  }
  .alert-warning {
    background: var(--butter);
    color: var(--butter-vivid);
  }
  .alert-info {
    background: var(--sky);
    color: var(--sky-vivid);
  }
</style>
