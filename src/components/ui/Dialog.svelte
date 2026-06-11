<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title: string;
    maxWidth?: string;
    children?: Snippet;
    actions?: Snippet;
  }

  let { open = $bindable(false), title, maxWidth = '28rem', children, actions }: Props = $props();

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
  style:max-width={maxWidth}
  onclick={(e) => {
    if (e.target === e.currentTarget) open = false;
  }}
  onclose={() => {
    open = false;
  }}
>
  <h2>{title}</h2>
  {@render children?.()}
  {#if actions}
    <div class="dialog-actions">
      {@render actions()}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    background: var(--card-bg);
    color: var(--foreground);
    border: 2px solid var(--foreground);
    box-shadow: var(--shadow-lg);
    filter: url('#rough');
    padding: var(--space-6);
    width: calc(100% - var(--space-8));
    margin: auto;

    &::backdrop {
      background: rgb(0 0 0 / 0.6);
    }

    h2 {
      font-size: var(--text-xl);
      margin-bottom: var(--space-3);
    }
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
    margin-top: var(--space-5);
  }
</style>
