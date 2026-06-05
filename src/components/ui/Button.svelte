<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'large';
    children: Snippet;
  }

  let { size, variant, children }: Props = $props();
</script>

<span class={['btn', `btn-${variant}`, size && `btn-${size}`]}>
  {@render children()}
</span>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 2px solid transparent;
    font-family: inherit;
    font-weight: 700;
    font-size: var(--text-sm);
    line-height: 1;
    padding: var(--space-2) var(--space-4);
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 3px 3px 0 transparent;
    transition:
      background-color var(--ease-fast),
      color var(--ease-fast),
      border-color var(--ease-fast),
      transform var(--ease-fast),
      box-shadow var(--ease-fast);

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  .btn-sm {
    font-size: var(--text-xs);
    padding: calc(var(--space-1) + 1px) var(--space-3);
  }
  .btn-lg {
    font-size: var(--text-base);
    padding: var(--space-3) var(--space-6);
  }

  .btn-primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent-hover);
    box-shadow: 3px 3px 0 var(--accent-hover);

    &:hover:not(:disabled) {
      background: var(--accent-hover);
      color: var(--accent-fg); /* prevent a:hover from overriding */
      border-color: var(--accent-hover);
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--accent-hover);
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--accent-hover);
    }
  }

  .btn-secondary {
    background: var(--bg-muted);
    color: var(--foreground);
    border-color: var(--foreground);
    box-shadow: 3px 3px 0 var(--foreground);

    &:hover:not(:disabled) {
      color: var(--foreground);
      background: var(--bg-faint);
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--foreground);
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--foreground);
    }
  }

  .btn-outline {
    background: transparent;
    color: var(--foreground);
    border-color: var(--foreground);
    box-shadow: 3px 3px 0 var(--foreground);

    &:hover:not(:disabled) {
      color: var(--foreground);
      background: var(--bg-muted);
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--foreground);
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--foreground);
    }
  }

  .btn-ghost {
    background: transparent;
    color: var(--foreground);
    border-color: transparent;
    box-shadow: none;

    &:hover:not(:disabled) {
      color: var(--foreground);
      background: var(--bg-muted);
    }
  }

  .btn-danger {
    background: var(--danger);
    color: #fff;
    border-color: color-mix(in srgb, var(--danger) 70%, #000);
    box-shadow: 3px 3px 0 color-mix(in srgb, var(--danger) 70%, #000);

    &:hover:not(:disabled) {
      color: #fff;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 color-mix(in srgb, var(--danger) 70%, #000);
    }
    &:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 color-mix(in srgb, var(--danger) 70%, #000);
    }
  }
</style>
