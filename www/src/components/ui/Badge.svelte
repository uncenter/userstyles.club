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
    padding: 0.125rem var(--space-2);
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 1.5;
    white-space: nowrap;
    border: 1.5px solid currentColor;
  }

  .badge-secondary {
    background: var(--bg-faint);
    color: var(--fg-muted);
    border-color: var(--border);
  }
  .badge-success {
    background: var(--mint);
    color: var(--mint-vivid);
  }
  .badge-warning {
    background: var(--butter);
    color: var(--butter-vivid);
  }
  .badge-danger {
    background: var(--danger-bg);
    color: var(--danger);
  }
</style>
