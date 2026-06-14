<script lang="ts">
  import type { Snippet } from 'svelte';
  import { XIcon } from '@lucide/svelte';

  interface Props {
    open?: boolean;
    title: string;
    children?: Snippet;
  }

  let { open = $bindable(false), title, children }: Props = $props();

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
  bind:this={dialogEl}
  onclick={(e) => {
    if (e.target === e.currentTarget) open = false;
  }}
  onclose={() => {
    open = false;
  }}
>
  <div class="dialog-header">
    <span>{title}</span>
    <button
      class="btn btn-icon btn-outline"
      type="button"
      onclick={() => (open = false)}
      aria-label="Close"
    >
      <XIcon size={16} />
    </button>
  </div>
  <div class="dialog-body">
    {@render children?.()}
  </div>
</dialog>

<style>
  dialog {
    background: var(--card-bg);
    color: var(--foreground);
    border: none;
    box-shadow: var(--shadow-lg);
    padding: var(--space-4);
    width: calc(100vw - var(--space-8));
    max-width: 80rem;
    height: calc(100vh - var(--space-8));
    max-height: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: auto;

    &:not([open]) {
      display: none;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid var(--foreground);
      pointer-events: none;
      filter: url('#rough');
      z-index: 10;
    }

    &::backdrop {
      background: rgb(0 0 0 / 0.6);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    flex-shrink: 0;
    font-weight: 700;
    font-size: var(--text-lg);
  }

  .dialog-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
