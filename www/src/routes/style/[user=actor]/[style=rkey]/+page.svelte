<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { joinPageTitle } from '$lib/constants';

  import { user, deleteUserstyle, getBlobCdnUrl, computeAverageRating } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { ActorHandle, CssPreview, PreviewImage, StarRating } from '$components';

  import { PencilIcon, Trash2Icon } from '@lucide/svelte';

  import bytes from 'pretty-bytes';
  import { formatDate } from '$lib/date';

  import Reviews from './Reviews.svelte';

  let deleting = $state(false);
  let error = $state<string | null>(null);

  let { data, params }: PageProps = $props();

  let confirmDialogOpen = $state(false);

  let averageRating = $derived(computeAverageRating(data.reviews));

  let lineCount = $derived(data.userstyle.value.sourceCode.split('\n').length);
  let byteCount = $derived(data.userstyle.value.sourceCode.length);
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
  <title>{joinPageTitle(data.userstyle.value.title)}</title>
</svelte:head>

<div class="page-wrapper">
  <section class="page-section userstyle-section">
    {#if data.userstyle.value.previewImage}
      <div class="style-preview grid-background">
        <PreviewImage
          src={getBlobCdnUrl(
            data.profile.did,
            data.userstyle.value.previewImage.ref.$link,
            'feed_fullsize',
          )}
          alt={data.userstyle.value.title}
        />
      </div>
    {/if}

    <div class="style-header">
      <div class="style-header-info">
        <h1 class="style-title">{data.userstyle.value.title}</h1>
        <p class="style-subtitle">
          {#if data.userstyle.value.updatedAt}
            Updated <time>{formatDate(data.userstyle.value.updatedAt)}</time>
          {:else}
            Published <time>{formatDate(data.userstyle.value.createdAt)}</time>
          {/if}
          {#if data.userstyle.value.license}
            · <a
              href="https://spdx.org/licenses/{data.userstyle.value.license}.html"
              target="_blank"
              rel="noopener noreferrer">{data.userstyle.value.license}</a
            >
          {/if}
        </p>
      </div>
      <ActorHandle profile={data.profile} />
    </div>

    {#if data.userstyle.value.description}
      <p class="style-description">{data.userstyle.value.description}</p>
    {/if}

    <div class="style-info">
      <div class="style-meta">
        <div class="style-item">
          <span class="style-item-value">
            {#if averageRating}
              <StarRating rating={averageRating.average} count={averageRating.count} />
            {:else}
              <StarRating rating={undefined} />
            {/if}
          </span>
          <span class="style-item-label">Rating</span>
        </div>
      </div>

      <a
        // Explicitly do not use getPreferredActorIdentifier given the install URL will be used for future updates and *should* be permanent.
        href={resolve('/style/[user=actor]/[style=rkey]/install', {
          user: data.profile.did,
          style: params.style,
        })}
        target="_blank"
        class="btn btn-primary btn-lg"
      >
        Install
      </a>
    </div>

    {#if error}
      <div class="section-pad">
        <Alert variant="error">{error}</Alert>
      </div>
    {/if}

    <div class="code-preview">
      <CssPreview source={data.userstyle.value.sourceCode} />
      <p class="code-meta">{bytes(byteCount)} · {lineCount} lines</p>
    </div>
  </section>

  {#if user.isLoggedIn && user.did === data.profile.did}
    <div class="owner-actions">
      <a
        href={resolve('/style/[user=actor]/[style=rkey]/edit', {
          user: getPreferredActorIdentifier(data.profile),
          style: params.style,
        })}
        class="btn btn-secondary btn-sm btn-icon"
        aria-label="Edit userstyle"
      >
        <PencilIcon size={14} />
      </a>
      <button
        type="button"
        class="btn btn-danger btn-sm btn-icon"
        aria-label="Delete userstyle"
        onclick={() => (confirmDialogOpen = true)}
      >
        <Trash2Icon size={14} />
      </button>
    </div>
  {/if}

  <div class="reviews-wrapper">
    <Reviews
      subject={data.userstyle.uri}
      owner={data.profile.did}
      reviews={data.reviews}
      reviewers={data.reviewers}
    />
  </div>
</div>

<Dialog bind:open={confirmDialogOpen} title="Delete userstyle?">
  {#snippet children()}
    <p class="text-muted">
      This will permanently delete <strong>{data.userstyle.value.title}</strong>. This cannot be
      undone.
    </p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (confirmDialogOpen = false)}>
      Cancel
    </button>
    <button class="btn btn-danger" type="button" onclick={confirmDelete} disabled={deleting}>
      {#if deleting}<Spinner size="sm" /> Deleting…{:else}Yes, delete!{/if}
    </button>
  {/snippet}
</Dialog>

<style>
  .page-wrapper {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: var(--space-3);

    @media (max-width: 40rem) {
      grid-template-columns: 1fr;
    }
  }

  .reviews-wrapper {
    grid-column: 1 / -1;
  }

  .owner-actions {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: calc(var(--space-6) + 5px);

    @media (max-width: 40rem) {
      grid-column: 1;
      grid-row: auto;
      flex-direction: row;
      justify-content: flex-end;
      padding-top: 0;
      margin-bottom: var(--space-3);
    }
  }

  .userstyle-section {
    border-top: 5px solid var(--brand-purple);
    overflow: hidden;
    padding: 0;
  }

  .style-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding: var(--space-6) var(--space-6) var(--space-4);

    .style-header-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    .style-subtitle {
      font-size: var(--text-sm);
      color: var(--fg-muted);

      time {
        font-weight: 600;
      }
    }
  }

  .style-title {
    font-size: var(--text-4xl);
  }

  .style-description {
    color: var(--fg-muted);
    line-height: 1.6;
    padding: 0 var(--space-6) var(--space-5);
  }

  .style-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6);
    margin-bottom: var(--space-6);

    @media (max-width: 639px) {
      flex-direction: column;
      align-items: stretch;

      .btn {
        justify-content: center;
      }
    }
  }

  .style-meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-5) var(--space-6);

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
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }
    }
  }

  .section-pad {
    padding: 0 var(--space-6) var(--space-4);
  }

  .style-preview {
    margin-bottom: var(--space-5);
    --grid-background-accent: var(--brand-purple);
  }

  .code-preview {
    padding: 0 var(--space-6) var(--space-6);
  }

  .code-meta {
    font-size: var(--text-xs);
    color: var(--fg-muted);
    text-align: right;
    padding: var(--space-1) var(--space-2);
  }
</style>
