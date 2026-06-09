<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { joinPageTitle } from '$lib/constants';

  import { user, deleteUserstyle } from '$lib/at';

  import { Spinner, Alert, ActorHandle, CssPreview, PreviewImage, Dialog } from '$components';

  import bytes from 'pretty-bytes';
  import { CakeIcon, PenLineIcon, RulerDimensionLineIcon, WeightIcon } from '@lucide/svelte';

  let deleting = $state(false);
  let error = $state<string | null>(null);

  let { data, params }: PageProps = $props();

  let confirmDialogOpen = $state(false);

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
    confirmDialogOpen = false;
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
      <button type="button" class="btn btn-danger btn-sm" onclick={() => confirmDialogOpen = true}>
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
          <time class="style-item-value">{formatDate(data.userstyle.createdAt)}</time>
          <span class="style-item-label"><CakeIcon size={12} /> Published</span>
        </div>
        <div class="style-item">
          <time class="style-item-value">{data.userstyle.updatedAt ? formatDate(data.userstyle.updatedAt) : '—'}</time>
          <span class="style-item-label"><PenLineIcon size={12} /> Last Updated</span>
        </div>
        <div class="style-item">
          <span class="style-item-value">{bytes(data.userstyle.sourceCode.length)}</span>
          <span class="style-item-label"><WeightIcon size={12} /> Size</span>
        </div>
        <div class="style-item">
          <span class="style-item-value">{data.userstyle.sourceCode.split('\n').length}</span>
          <span class="style-item-label"><RulerDimensionLineIcon size={12} /> Lines</span>
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

<Dialog bind:open={confirmDialogOpen} title="Delete userstyle?">
  {#snippet children()}
    <p class="text-muted">
      This will permanently delete <strong>{data.userstyle.title}</strong>. This cannot be undone.
    </p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => confirmDialogOpen = false}>
      Cancel
    </button>
    <button class="btn btn-danger" type="button" onclick={confirmDelete} disabled={deleting}>
      {#if deleting}<Spinner size="sm" /> Deleting…{:else}Yes, delete!{/if}
    </button>
  {/snippet}
</Dialog>

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
    flex-direction: row;
    gap: var(--space-6);

    .style-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      .style-item-value {
        font-size: var(--text-base);
        font-weight: 700;
        color: var(--foreground);
      }

      .style-item-label {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--text-xs);
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

</style>
