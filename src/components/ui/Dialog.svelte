<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title: string;
    dismissible?: boolean;
    children?: Snippet;
    actions?: Snippet;
  }

  let { open = $bindable(false), title, dismissible = true, children, actions }: Props = $props();

  let dialogEl: HTMLDialogElement;

  $effect(() => {
    if (!dialogEl) return;
    if (open) {
      if (!dialogEl.open) dialogEl.showModal();
    } else {
      if (dialogEl.open) dialogEl.close();
    }
  });
</script>

<dialog
  class="dialog"
  bind:this={dialogEl}
  closedby={dismissible ? 'any' : 'none'}
  onclick={(e) => {
    if (dismissible && e.target === e.currentTarget) open = false;
  }}
  oncancel={(e) => {
    if (!dismissible) e.preventDefault();
  }}
  onclose={() => {
    open = false;
  }}
>
  <h2 class="dialog__title">{title}</h2>
  {@render children?.()}
  {#if actions}
    <div class="dialog__actions">
      {@render actions()}
    </div>
  {/if}
</dialog>

<style>
  .dialog {
    background: var(--card-bg);
    color: var(--foreground);
    border: none;
    border-radius: var(--radius-lg);
    padding: var(--padding, var(--space-6));
    width: calc(100% - var(--space-8));
    max-width: var(--max-width, 28rem);
    margin: auto;
    overflow: visible;
    opacity: 0;
    transform: translateY(4px) scale(0.98);
    transition:
      opacity var(--ease),
      transform var(--ease),
      overlay var(--ease) allow-discrete,
      display var(--ease) allow-discrete;

    &[open] {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    @starting-style {
      &[open] {
        opacity: 0;
        transform: translateY(4px) scale(0.98);
      }
    }

    &::backdrop {
      background: rgb(0 0 0 / 0.55);
      backdrop-filter: blur(2px);
      opacity: 0;
      transition:
        opacity var(--ease),
        overlay var(--ease) allow-discrete,
        display var(--ease) allow-discrete;
    }

    &[open]::backdrop {
      opacity: 1;
    }

    @starting-style {
      &[open]::backdrop {
        opacity: 0;
      }
    }

    .dialog__title {
      font-size: var(--text-xl);
      margin-bottom: var(--space-3);
    }

    .dialog__actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      margin-top: var(--space-5);
    }
  }
</style>
