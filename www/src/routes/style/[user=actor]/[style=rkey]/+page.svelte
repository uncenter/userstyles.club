<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';

  import { joinPageTitle } from '$lib/constants';

  import { parseResourceUri } from '@atcute/lexicons';

  import {
    user,
    getBlobCdnUrl,
    computeAverageRating,
    createRating,
    updateRating,
    deleteRating,
    getCommentThreads,
    type ReviewThread,
    type UserstyleFeedback,
  } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { ActorHandle, CssPreview, PreviewImage, StarRating, StarRatingAverage, StarRatingInput } from '$components';

  import { ScaleIcon } from '@lucide/svelte';

  import bytes from 'pretty-bytes';
  import { formatDate } from '$lib/date';

  import Comments from './Comments.svelte';

  import { proxify } from '$lib/proxify.svelte';

  let { data, params }: PageProps = $props();
  let userstyle = $derived(data.userstyle.value);

  let feedback = $state<UserstyleFeedback>({ comments: [], ratings: {} });
  $effect(() => { data.feedback.then(fb => { feedback = proxify(fb); }); });

  const threads: ReviewThread[] = $derived(getCommentThreads(feedback.comments).map((thread) => {
    const did = parseResourceUri(thread.comment.uri).repo!;
    return { ...thread, rating: feedback.ratings[did] };
  }));

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

  let lineCount = $derived(userstyle.sourceCode.split('\n').length);
  let byteCount = $derived(userstyle.sourceCode.length);

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

</script>

<svelte:head>
  <title>{joinPageTitle(userstyle.title)}</title>
</svelte:head>

<div class="page-wrapper">
  <section class="page-section userstyle-section">
    {#if userstyle.previewImage}
      <div class="style-preview grid-background">
        <PreviewImage
          src={getBlobCdnUrl(
            data.profile.did,
            userstyle.previewImage,
            'feed_fullsize',
          )}
          alt={userstyle.title}
        />
      </div>
    {/if}

    <div class="style-header">
      <div class="style-header-info">
        <h1 class="style-title">{userstyle.title}</h1>
        <p class="style-subtitle">
          {#if userstyle.updatedAt}
            Updated <time>{formatDate(userstyle.updatedAt)}</time>
          {:else}
            Published <time>{formatDate(userstyle.createdAt)}</time>
          {/if}
          {#if userstyle.license}
            · <a
              class="subtitle-link"
              href="https://spdx.org/licenses/{userstyle.license}.html"
              target="_blank"
              rel="noopener noreferrer"
            >{userstyle.license}<ScaleIcon size={10} /></a>
          {/if}
        </p>
      </div>
      <ActorHandle profile={data.profile} />
    </div>

    {#if userstyle.description}
      <p class="style-description">{userstyle.description}</p>
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

      <div class="style-actions">
        {#if user.isLoggedIn && user.did === data.profile.did}
          <a
            href={resolve('/style/[user=actor]/[style=rkey]/manage', {
              user: getPreferredActorIdentifier(data.profile),
              style: params.style,
            })}
            class="btn btn-secondary btn-lg"
          >
            Manage
          </a>
        {/if}
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
    </div>

    <div class="code-preview">
      <CssPreview source={userstyle.sourceCode} />
      <div class="code-footer">
        {#if userstyle.upstreamUrl}
          <span class="upstream-source">Upstreamed from <a
            href={userstyle.upstreamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >{userstyle.upstreamUrl}</a>.</span>
        {/if}
        <p class="source-stats">{bytes(byteCount)} · {lineCount} lines</p>
      </div>
    </div>
  </section>

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

<style>
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

      .style-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .btn {
        justify-content: center;
      }
    }
  }

  .style-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
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
