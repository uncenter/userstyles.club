<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { joinPageTitle } from '$lib/constants';

  import { user, deleteUserstyle } from '$lib/at';

  import { Spinner, Alert, ActorHandle, CssPreview, PreviewImage } from '$components';

  import bytes from 'pretty-bytes';
  import { CakeIcon, PenLineIcon, RulerDimensionLineIcon, WeightIcon } from '@lucide/svelte';

  let deleting = $state(false);
  let error = $state<string | null>(null);

  let { data, params }: PageProps = $props();

  let confirmDialog: HTMLDialogElement;

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async function removeUserstyle() {
    error = null;
    deleting = true;

    try {
      await deleteUserstyle(data.style);
      goto(resolve('/'));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete userstyle.';
    } finally {
      deleting = false;
    }
  }

  async function confirmDelete() {
    confirmDialog.close();
    await removeUserstyle();
  }
</script>

<svelte:head>
  <title>{joinPageTitle(data.userstyle.title)}</title>
</svelte:head>

<div class="narrow-col">
  {#if user.isLoggedIn && user.did === data.profile.did}
    <div class="owner-toolbar">
      <a
        href={resolve('/style/[user=actor]/[style=rkey]/edit', {
          user: params.user,
          style: params.style
        })}
        class="btn btn-secondary btn-sm"
      >
        Edit
      </a>
      <button type="button" class="btn btn-danger btn-sm" onclick={() => confirmDialog.showModal()}>
        Delete
      </button>
    </div>
  {/if}

  <section class="page-section">
    <div class="style-header">
      <h1 class="style-title">{data.userstyle.title}</h1>
      <ActorHandle
        profile={data.profile}
        href={resolve('/profile/[user=actor]', { user: params.user })}
        variant="lavender"
      />
    </div>

    {#if data.userstyle.description}
      <p class="style-description">{data.userstyle.description}</p>
    {/if}

    <div class="style-info">
      <div class="style-meta">
        <div class="style-item">
          <span class="style-item-label"><CakeIcon size={16} /> Published</span>
          <time class="style-item-value">{formatDate(data.userstyle.createdAt)}</time>
        </div>
        <div class="style-item">
          <span class="style-item-label"><PenLineIcon size={16} /> Last Updated</span>
          <time class="style-item-value">{data.userstyle.updatedAt ? formatDate(data.userstyle.updatedAt) : '-'}</time>
        </div>
        <div class="style-item">
          <span class="style-item-label"><WeightIcon size={16} /> Size</span>
          <span class="style-item-value">{bytes(data.userstyle.sourceCode.length)}</span>
        </div>
        <div class="style-item">
          <span class="style-item-label"><RulerDimensionLineIcon size={16} /> Lines</span>
          <span class="style-item-value">{data.userstyle.sourceCode.split('\n').length}</span>
        </div>
      </div>

      <a
        href={resolve('/install/[user=actor]/[style=rkey].user.css', {
          user: params.user,
          style: params.style
        })}
        target="_blank"
        class="btn btn-primary btn-lg"
      >
        Install
      </a>
    </div>

    {#if error}
      <Alert variant="error">{error}</Alert>
    {/if}

    {#if data.previewImageUrl}
      <div class="style-preview">
        <PreviewImage src={data.previewImageUrl} alt={data.userstyle.title} />
      </div>
    {/if}

    <div class="code-preview">
      <CssPreview source={data.userstyle.sourceCode} />
    </div>
  </section>
</div>

<dialog
  bind:this={confirmDialog}
  class="confirm-dialog"
  onclick={(e) => {
    if (e.target === e.currentTarget) confirmDialog.close();
  }}
>
  <h2>Delete userstyle?</h2>
  <p>
    This will permanently delete userstyle <strong>{data.userstyle.title}</strong>. This cannot be
    undone.
  </p>
  <div class="confirm-dialog-actions">
    <button class="btn btn-outline" type="button" onclick={() => confirmDialog.close()}>
      Cancel
    </button>
    <button class="btn btn-danger" type="button" onclick={confirmDelete} disabled={deleting}>
      {#if deleting}<Spinner size="sm" /> Deleting…{:else}Yes, delete!{/if}
    </button>
  </div>
</dialog>

<style>
  .owner-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .style-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin-bottom: var(--space-4);
  }

  .style-title {
    font-size: var(--text-4xl);
  }

  .style-info {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: var(--space-4);
    padding-bottom: var(--space-5);
    margin-bottom: var(--space-5);
    border-bottom: 2px solid var(--border);
  }

  .style-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .style-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);

      .style-item-label {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: var(--bg-faint);
        border: 1px solid var(--border);
        padding: 0.1rem var(--space-2);
        font-size: var(--text-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--fg-muted);
      }

      .style-item-value {
        color: var(--fg-muted);
      }
    }
  }

  .style-description {
    color: var(--fg-muted);
    line-height: 1.6;
    margin-bottom: var(--space-5);
  }

  .style-preview {
    margin-bottom: var(--space-5);
  }

  .code-preview {
    isolation: isolate;
    overflow: clip;

    :global(pre) {
      max-height: 14rem;
      overflow-y: auto;
    }
  }

  .confirm-dialog {
    background: var(--card-bg);
    color: var(--foreground);
    border: 2px solid var(--foreground);
    box-shadow: var(--shadow-lg);
    filter: url('#rough');
    padding: var(--space-6);
    max-width: 28rem;
    width: calc(100% - var(--space-8));
    margin: auto;

    &::backdrop {
      background: rgb(0 0 0 / 0.6);
    }

    h2 {
      font-size: var(--text-xl);
      margin-bottom: var(--space-3);
    }

    p {
      color: var(--fg-muted);
      line-height: 1.6;
      margin-bottom: var(--space-5);
    }

    .confirm-dialog-actions {
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
    }
  }
</style>
