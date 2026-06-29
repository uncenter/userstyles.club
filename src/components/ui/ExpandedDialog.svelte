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
  class="dialog"
  bind:this={dialogEl}
  onclick={(e) => {
    if (e.target === e.currentTarget) open = false;
  }}
  onclose={() => {
    open = false;
  }}
>
  <div class="dialog__header">
    <span>{title}</span>
    <button
      class="btn btn--icon btn--outline"
      type="button"
      onclick={() => (open = false)}
      aria-label="Close"
    >
      <XIcon size={16} />
    </button>
  </div>
  <div class="dialog__body">
    {@render children?.()}
  </div>
</dialog>

<style>
  .dialog {
    background: var(--card-bg);
    color: var(--foreground);
    border: none;
    border-radius: var(--radius-lg);
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

    &::backdrop {
      background: rgb(0 0 0 / 0.55);
      backdrop-filter: blur(2px);
    }

    .dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      flex-shrink: 0;
      font-weight: 700;
      font-size: var(--text-lg);
    }

    .dialog__body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
  }
</style>
