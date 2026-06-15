<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'secondary' | 'success' | 'warning' | 'danger';
    children: Snippet;
  }

  let { variant = 'secondary', children }: Props = $props();
</script>

<span class="badge badge-{variant}">
  {@render children()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem var(--space-2);
    font-size: var(--text-xs);
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
    border-radius: var(--radius-pill);
    border: 1.5px solid transparent;
  }

  .badge-secondary {
    background: var(--bg-faint);
    color: var(--fg-muted);
    border-color: var(--border);
  }
  .badge-success {
    background: var(--success-bg);
    color: var(--success);
    border-color: color-mix(in srgb, var(--success) 30%, transparent);
  }
  .badge-warning {
    background: var(--warning-bg);
    color: var(--warning);
    border-color: color-mix(in srgb, var(--warning) 30%, transparent);
  }
  .badge-danger {
    background: var(--danger-bg);
    color: var(--danger);
    border-color: color-mix(in srgb, var(--danger) 25%, transparent);
  }
</style>
