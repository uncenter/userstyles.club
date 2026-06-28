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
    type CommentRecord,
    type ReviewThread,
  } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  import { Loading, Alert, Dialog } from '$components/ui';
  import { ActorHandle, CssPreview, PreviewImage, StarRating, StarRatingAverage, StarRatingInput } from '$components';

  import { DownloadIcon, ExternalLinkIcon, HouseIcon, PencilIcon, ScaleIcon } from '@lucide/svelte';

  import bytes from 'pretty-bytes';
  import { formatDate } from '$lib/date';

  import Comments from './Comments.svelte';

  import { proxify } from '$lib/proxify.svelte';

  let { data, params }: PageProps = $props();
  let userstyle = $derived(data.userstyle.value);

  let feedback = $derived(proxify(data.feedback));

  const threads: ReviewThread[] = $derived(
    getCommentThreads(feedback.comments).map((thread) => {
      const did = parseResourceUri(thread.comment.uri).repo!;
      return { ...thread, rating: feedback!.ratings[did] };
    })
  );

  let averageRating = $derived(computeAverageRating(Object.values(feedback.ratings)));
  let myRating = $derived(user.isLoggedIn ? feedback.ratings[user.did!] : undefined);
  let canRate = $derived(user.isLoggedIn && user.did !== data.profile.did);

  function onCommentAdded(comment: CommentRecord) {
    feedback.comments.push(comment);
  }
  function onCommentDeleted(uri: string) {
    feedback.comments = feedback.comments.filter((c) => c.uri !== uri);
  }

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
      <div class="userstyle-section__preview grid-background">
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

    <div class="userstyle-section__header">
      <div class="userstyle-section__header-info">
        <h1 class="userstyle-section__title">{userstyle.title}</h1>
        <p class="userstyle-section__subtitle">
          {#if userstyle.updatedAt}
            Updated <time class="userstyle-section__subtitle-time">{formatDate(userstyle.updatedAt)}</time>
          {:else}
            Published <time class="userstyle-section__subtitle-time">{formatDate(userstyle.createdAt)}</time>
          {/if}
          {#if userstyle.license}
            · <a
              class="userstyle-section__subtitle-link"
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
      <p class="userstyle-section__description">{userstyle.description}</p>
    {/if}

    <div class="userstyle-section__info">
      <div class="userstyle-section__meta">
        {#if canRate}
          <button type="button" class="userstyle-section__item userstyle-section__item--ratable" aria-label="Rate this userstyle" onclick={openRatingDialog}>
            <span class="userstyle-section__item-value">
              <StarRatingAverage average={averageRating?.average} count={averageRating?.count} />
            </span>
            <span class="userstyle-section__item-label">Rating{#if myRating}{' · '}<StarRating value={myRating.value.rating} label="Your rating: {myRating.value.rating}/5" />{/if}</span>
          </button>
        {:else}
          <div class="userstyle-section__item">
            <span class="userstyle-section__item-value">
              <StarRatingAverage average={averageRating?.average} count={averageRating?.count} />
            </span>
            <span class="userstyle-section__item-label">Rating</span>
          </div>
        {/if}
      </div>

      <div class="userstyle-section__actions">
        {#if userstyle.homepageUrl}
          <a
            href={userstyle.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn--outline btn--lg"
          >
            <ExternalLinkIcon size={16} />Homepage
          </a>
        {/if}
        {#if user.isLoggedIn && user.did === data.profile.did}
          <a
            href={resolve('/style/[user=actor]/[style=rkey]/manage', {
              user: getPreferredActorIdentifier(data.profile),
              style: params.style,
            })}
            class="btn btn--secondary btn--lg"
          >
            <PencilIcon size={16} />Manage
          </a>
        {/if}
        <a
          // Explicitly do not use getPreferredActorIdentifier given the install URL will be used for future updates and *should* be permanent.
          href={resolve('/style/[user=actor]/[style=rkey].user.css', {
            user: data.profile.did,
            style: params.style,
          })}
          target="_blank"
          class="btn btn--primary btn--lg"
        >
          <DownloadIcon size={16} />Install
        </a>
      </div>
    </div>

    <div class="userstyle-section__code">
      <CssPreview source={userstyle.sourceCode} />
      <div class="userstyle-section__code-footer">
        {#if userstyle.upstreamUrl}
          <span class="userstyle-section__upstream">Upstreamed from <a
            class="userstyle-section__upstream-link"
            href={userstyle.upstreamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >{userstyle.upstreamUrl}</a>.</span>
        {/if}
        <p class="userstyle-section__stats">{bytes(byteCount)} · {lineCount} lines</p>
      </div>
    </div>
  </section>

  <div class="page-wrapper__comments">
    <Comments
      userstyle={data.userstyle.uri}
      owner={data.profile.did}
      {feedback}
      {threads}
      {onCommentAdded}
      {onCommentDeleted}
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
    <button class="btn btn--outline" type="button" onclick={() => (ratingDialog.open = false)}>
      Cancel
    </button>
    {#if myRating}
      <button class="btn btn--secondary" type="button" onclick={removeRating} disabled={ratingDialog.deleting || ratingDialog.submitting}>
        <Loading pending={ratingDialog.deleting} idle="Remove" active="Removing…" />
      </button>
    {/if}
    <button class="btn btn--primary" type="button" onclick={submitRating} disabled={ratingDialog.submitting || ratingDialog.deleting || !ratingDialog.selected}>
      <Loading pending={ratingDialog.submitting} idle={myRating ? 'Update' : 'Submit'} active="Saving…" />
    </button>
  {/snippet}
</Dialog>

<style>
  .userstyle-section {
    border-top: 5px solid var(--brand-purple);
    overflow: hidden;
    padding: 0;
  }

  .userstyle-section__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding: var(--space-6) var(--space-6) var(--space-4);

    .userstyle-section__header-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    .userstyle-section__subtitle {
      font-size: var(--text-sm);
      color: var(--fg-muted);

      .userstyle-section__subtitle-time {
        font-weight: 600;
      }

      .userstyle-section__subtitle-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        vertical-align: middle;
      }

    }
  }

  .userstyle-section__title {
    font-size: var(--text-4xl);
  }

  .userstyle-section__description {
    color: var(--fg-muted);
    line-height: 1.6;
    padding: 0 var(--space-6) var(--space-5);
  }

  .userstyle-section__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6);
    margin-bottom: var(--space-6);

    @media (max-width: 639px) {
      flex-direction: column;
      align-items: stretch;

      .userstyle-section__actions {
        flex-direction: column;
        align-items: stretch;
      }

      .btn {
        justify-content: center;
      }
    }
  }

  .userstyle-section__actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .userstyle-section__meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-5) var(--space-6);

    .userstyle-section__item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      .userstyle-section__item-value {
        font-size: var(--text-base);
        font-weight: 700;
        color: var(--foreground);
      }

      .userstyle-section__item-label {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }

      &.userstyle-section__item--ratable {
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

  .userstyle-section__preview {
    margin-bottom: var(--space-5);
    --grid-background-accent: var(--brand-purple);
  }

  .userstyle-section__code {
    padding: 0 var(--space-6) var(--space-6);
  }

  .userstyle-section__code-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    gap: var(--space-4);
    font-size: var(--text-sm);
    color: var(--fg-muted);

    .userstyle-section__upstream {
      min-width: 0;

      .userstyle-section__upstream-link {
        overflow-wrap: break-word;
        word-break: break-all;
      }
    }

    .userstyle-section__stats {
      margin-left: auto;
      white-space: nowrap;
    }
  }
</style>
