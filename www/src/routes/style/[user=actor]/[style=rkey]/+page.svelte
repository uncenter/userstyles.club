<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { joinPageTitle } from '$lib/constants';

  import { parseResourceUri } from '@atcute/lexicons';

  import {
    user,
    deleteUserstyle,
    getBlobCdnUrl,
    computeAverageRating,
    createRating,
    updateRating,
    deleteRating,
    getCommentThreads,
    type ReviewThread,
  } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { ActorHandle, CssPreview, PreviewImage, StarRating, StarRatingAverage, StarRatingInput } from '$components';

  import { PencilIcon, Trash2Icon, ScaleIcon } from '@lucide/svelte';

  import bytes from 'pretty-bytes';
  import { formatDate } from '$lib/date';

  import Comments from './Comments.svelte';
  import SyncFromUpstream from './SyncFromUpstream.svelte';

  import { proxify } from '$lib/proxify.svelte';

  let deleting = $state(false);
  let error = $state<string | null>(null);

  let { data, params }: PageProps = $props();

  let feedback = $derived(proxify(data.feedback));

  const threads: ReviewThread[] = $derived(getCommentThreads(feedback.comments).map((thread) => {
    const did = parseResourceUri(thread.comment.uri).repo!;
    return { ...thread, rating: feedback.ratings[did] };
  }));

  let confirmDialogOpen = $state(false);

  let averageRating = $derived(computeAverageRating(Object.values(feedback.ratings)));
  let myRating = $derived(user.isLoggedIn ? feedback.ratings[user.did!] : undefined);
  let canRate = $derived(user.isLoggedIn && user.did !== data.profile.did);

  let ratingDialog = $state({
    open: false,
    selected: undefined as number | undefined,
    submitting: false,
    deleting: false,
    error: null as string | null,
  });

  let lineCount = $derived(data.userstyle.value.sourceCode.split('\n').length);
  let byteCount = $derived(data.userstyle.value.sourceCode.length);

  function openRatingDialog() {
    ratingDialog.selected = myRating?.value.rating;
    ratingDialog.error = null;
    ratingDialog.open = true;
  }

  async function submitRating() {
    if (!ratingDialog.selected) return;
    ratingDialog.error = null;
    ratingDialog.submitting = true;
    try {
      if (myRating) {
        const { rkey } = parseResourceUri(myRating.uri);
        await updateRating(rkey!, { subject: data.userstyle.uri, rating: ratingDialog.selected, createdAt: myRating.value.createdAt });
        feedback.ratings[user.did!].value.rating = ratingDialog.selected;
      } else {
        const created = await createRating({ subject: data.userstyle.uri, rating: ratingDialog.selected });
        feedback.ratings[user.did!] = { uri: created.response.uri, value: created.record };
      }
      ratingDialog.open = false;
    } catch (e) {
      ratingDialog.error = e instanceof Error ? e.message : 'Failed to save rating.';
    } finally {
      ratingDialog.submitting = false;
    }
  }

  async function removeRating() {
    if (!myRating) return;
    ratingDialog.error = null;
    ratingDialog.deleting = true;
    try {
      const { rkey } = parseResourceUri(myRating.uri);
      await deleteRating(rkey!);
      delete feedback.ratings[user.did!];
      ratingDialog.open = false;
    } catch (e) {
      ratingDialog.error = e instanceof Error ? e.message : 'Failed to remove rating.';
    } finally {
      ratingDialog.deleting = false;
    }
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
  <title>{joinPageTitle(data.userstyle.value.title)}</title>
</svelte:head>

<div class="page-wrapper">
  <section class="page-section userstyle-section">
    {#if data.userstyle.value.previewImage}
      <div class="style-preview grid-background">
        <PreviewImage
          src={getBlobCdnUrl(
            data.profile.did,
            data.userstyle.value.previewImage,
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
              class="subtitle-link"
              href="https://spdx.org/licenses/{data.userstyle.value.license}.html"
              target="_blank"
              rel="noopener noreferrer"
            >{data.userstyle.value.license}<ScaleIcon size={10} /></a>
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
        {#if canRate}
          <button type="button" class="style-item ratable" aria-label="Rate this userstyle" onclick={openRatingDialog}>
            <span class="style-item-value">
              <StarRatingAverage average={averageRating?.average} count={averageRating?.count} />
            </span>
            <span class="style-item-label">Rating{#if myRating}{' · '}<StarRating value={myRating.value.rating} label="Your rating: {myRating.value.rating}/5" />{/if}</span>
          </button>
        {:else}
          <div class="style-item">
            <span class="style-item-value">
              <StarRatingAverage average={averageRating?.average} count={averageRating?.count} />
            </span>
            <span class="style-item-label">Rating</span>
          </div>
        {/if}
      </div>

      <a
        // Explicitly do not use getPreferredActorIdentifier given the install URL will be used for future updates and *should* be permanent.
        href={resolve('/style/[user=actor]/[style=rkey].user.css', {
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
      <div class="code-footer">
        {#if data.userstyle.value.upstreamUrl}
          <span class="upstream-source">Upstreamed from <a
            href={data.userstyle.value.upstreamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >{data.userstyle.value.upstreamUrl}</a>.</span>
        {/if}
        <p class="source-stats">{bytes(byteCount)} · {lineCount} lines</p>
      </div>
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
      {#if data.userstyle.value.upstreamUrl}
        <SyncFromUpstream userstyle={data.userstyle.value} rkey={data.style} />
      {/if}
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

  <div class="comments-wrapper">
    <Comments
      userstyle={data.userstyle.uri}
      owner={data.profile.did}
      bind:feedback
      {threads}
    />
  </div>
</div>

<Dialog bind:open={ratingDialog.open} title={myRating ? 'Update your rating' : 'Rate this userstyle'}>
  {#snippet children()}
    {#if ratingDialog.error}
      <Alert variant="error">{ratingDialog.error}</Alert>
    {/if}
    <StarRatingInput bind:value={ratingDialog.selected} />
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (ratingDialog.open = false)}>
      Cancel
    </button>
    {#if myRating}
      <button class="btn btn-secondary" type="button" onclick={removeRating} disabled={ratingDialog.deleting || ratingDialog.submitting}>
        {#if ratingDialog.deleting}<Spinner size="sm" /> Removing…{:else}Remove{/if}
      </button>
    {/if}
    <button class="btn btn-primary" type="button" onclick={submitRating} disabled={ratingDialog.submitting || ratingDialog.deleting || !ratingDialog.selected}>
      {#if ratingDialog.submitting}<Spinner size="sm" /> Saving…{:else}{myRating ? 'Update' : 'Submit'}{/if}
    </button>
  {/snippet}
</Dialog>

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

  .comments-wrapper {
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

      .subtitle-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        vertical-align: middle;
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

      &.ratable {
        appearance: none;
        border: none;
        background: none;
        font: inherit;
        text-align: left;
        cursor: pointer;
        border-radius: var(--radius-sm);
        padding: var(--space-2);
        margin: calc(-1 * var(--space-2));
        transition: background 0.1s;

        &:hover {
          background: var(--bg-muted);
        }
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

  .code-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    gap: var(--space-4);
    font-size: var(--text-sm);
    color: var(--fg-muted);

    .upstream-source {
      min-width: 0;

      a {
        overflow-wrap: break-word;
        word-break: break-all;
      }
    }

    .source-stats {
      margin-left: auto;
      white-space: nowrap;
    }
  }
</style>
