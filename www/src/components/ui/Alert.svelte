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

<div class="alert alert--{variant}" role="alert">
  <em class="alert__icon" aria-hidden="true">{icons[variant]}</em>
  <div class="alert__content">
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
    border-radius: var(--radius);
    border: 1.5px solid color-mix(in srgb, currentColor 30%, transparent);
    border-left: 4px solid currentColor;

    .alert__icon {
      flex-shrink: 0;
      font-weight: 700;
      margin-top: 1px;
      font-style: normal;
    }
    .alert__content {
      flex: 1;
    }

    &.alert--error {
      background: var(--danger-bg);
      color: var(--danger);
    }
    &.alert--success {
      background: var(--success-bg);
      color: var(--success);
    }
    &.alert--warning {
      background: var(--warning-bg);
      color: var(--warning);
    }
    &.alert--info {
      background: var(--info-bg);
      color: var(--info);
    }
  }
</style>
