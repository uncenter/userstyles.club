<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';

  import { proxify } from '$lib/proxify.svelte';

  import { parseCanonicalResourceUri, type CanonicalResourceUri } from '@atcute/lexicons';

  import {
    user,
    getBlobCdnUrl,
    createRating,
    updateRating,
    deleteRating,
    getUserRatingForStyle,
    getUserstyleSourceCode,
    buildCommentThreads,
    applyCommentPatches,
    type CommentRecord,
    type CommentThreadPatch,
    type RatingRecord,
  } from '$lib/at';
  import {
    getPreferredActorIdentifier,
    preferences,
    recordStyleVisit,
  } from '$lib/preferences.svelte';
  import { extractDomains } from '$lib/domains';
  import { getUsercssMetadata } from '../../../new/import/metadata';

  import { Loading, Alert, Dialog, Badge } from '$components/ui';
  import { ActorHandle, CssPreview, Meta, PreviewImage } from '$components';
  import Comments from './Comments.svelte';

  import {
    DownloadIcon,
    ExternalLinkIcon,
    ArrowRightIcon,
    PencilIcon,
    ScaleIcon,
    CopyIcon,
    CheckIcon,
  } from '@lucide/svelte';
  import StylusIcon from '$lib/assets/stylus.png';

  import bytes from 'pretty-bytes';
  import { formatDate, formatDateTimeRelative } from '$lib/date';
  import { getLatestDate } from '$lib/at/utils';

  let { data, params }: PageProps = $props();
  let userstyle = $derived(data.userstyle.value);
  let sourceCode = $derived(
    await getUserstyleSourceCode(data.userstyle).catch((error: unknown) => {
      console.error('failed to load userstyle source code', error);
      return undefined;
    }),
  );

  let ogImage = $derived(
    userstyle.previewImage
      ? getBlobCdnUrl(data.profile.did, userstyle.previewImage, 'feed_fullsize')
      : undefined,
  );

  let ratingSummary = $derived(proxify(data.feedback.ratingSummary));
  let myRating = $derived<RatingRecord | undefined>(
    user.isLoggedIn ? await getUserRatingForStyle(data.userstyle.uri, user.did) : undefined,
  );

  $effect(() => {
    recordStyleVisit({
      uri: data.userstyle.uri,
      title: data.userstyle.value.title,
      authorDid: data.profile.did,
      authorHandle: data.profile.handle,
    });
  });

  function applyRatingToSummary(previous: number | undefined, next: number) {
    const total = (ratingSummary.average ?? 0) * ratingSummary.count;
    const count = previous === undefined ? ratingSummary.count + 1 : ratingSummary.count;
    ratingSummary.count = count;
    ratingSummary.average = (total - (previous ?? 0) + next) / count;
  }

  function removeRatingFromSummary(previous: number) {
    const count = ratingSummary.count - 1;
    const total = (ratingSummary.average ?? 0) * ratingSummary.count - previous;
    ratingSummary.count = count;
    ratingSummary.average = count > 0 ? total / count : undefined;
  }

  // Optimistic local updates, not yet reflected in the initial server response, keyed by comment uri.
  // An add/edit/delete are all just a patch over that uri's node.
  let pendingCommentPatches = $state<Record<string, CommentThreadPatch>>({});

  let comments = $derived.by(() =>
    buildCommentThreads(
      applyCommentPatches(data.feedback.commentThreadNodes, pendingCommentPatches),
    ),
  );

  function onCommentAdded(comment: CommentRecord) {
    pendingCommentPatches[comment.uri] = {
      uri: comment.uri,
      parentUri: comment.value.parent?.uri as CanonicalResourceUri | undefined,
      deleted: false,
      comment,
    };
  }

  function onCommentDeleted(uri: string) {
    pendingCommentPatches[uri] = { ...pendingCommentPatches[uri], deleted: true };
  }

  function onCommentEdited(comment: CommentRecord) {
    pendingCommentPatches[comment.uri] = { ...pendingCommentPatches[comment.uri], comment };
  }

  let lineCount = $derived(sourceCode?.split('\n').length ?? 0);
  let byteCount = $derived(sourceCode?.length ?? 0);
  let version = $derived(
    sourceCode !== undefined ? getUsercssMetadata(sourceCode).version : undefined,
  );

  let domains = $derived(extractDomains(data.userstyle.extras?.mozDocumentFunctions ?? []));
  let commentCount = $derived(data.feedback.commentThreadNodes.length);

  // The appview attaches a commenter's current rating to their root-level comment(s).
  function applyRatingPatchToComments(rating: number | undefined) {
    if (!user.did) return;
    for (const thread of comments.threads) {
      if (!thread.deleted && parseCanonicalResourceUri(thread.uri).repo === user.did) {
        pendingCommentPatches[thread.uri] = { ...pendingCommentPatches[thread.uri], rating };
      }
    }
  }

  const installUrl = $derived(
    // Explicitly do not use getPreferredActorIdentifier given the install URL will be used for future updates and *should* be permanent.
    resolve('/style/[user=actor]/[style=rkey].user.css', {
      user: data.profile.did,
      style: params.style,
    }),
  );

  let stylusDialog = $state({
    open: false,
    step: 'ask' as 'ask' | 'confirm',
  });

  function onInstallClick(e: MouseEvent) {
    if (preferences.get('hasStylusInstalled')) return;
    e.preventDefault();
    stylusDialog.step = 'ask';
    stylusDialog.open = true;
  }

  function onGetStylusClick() {
    stylusDialog.step = 'confirm';
  }

  function continueToInstall() {
    preferences.set('hasStylusInstalled', true);
    stylusDialog.open = false;
    window.open(installUrl, '_blank');
  }

  let atUriCopied = $state(false);

  async function copyAtUri() {
    try {
      await navigator.clipboard.writeText(data.userstyle.uri);
      atUriCopied = true;
      setTimeout(() => (atUriCopied = false), 1500);
    } catch (e) {
      console.error('failed to copy at uri', e);
    }
  }

  async function submitRatingChange(value: number | undefined) {
    if (value === undefined) {
      if (!myRating) return;
      const { rkey } = parseCanonicalResourceUri(myRating.uri);
      await deleteRating(rkey);
      removeRatingFromSummary(myRating.value.rating);
      myRating = undefined;
    } else if (myRating) {
      const { rkey } = parseCanonicalResourceUri(myRating.uri);
      await updateRating(rkey, {
        subject: { uri: data.userstyle.uri, cid: data.userstyle.cid! },
        rating: value,
        createdAt: myRating.value.createdAt,
      });
      applyRatingToSummary(myRating.value.rating, value);
      myRating = { ...myRating, value: { ...myRating.value, rating: value } };
    } else {
      const created = await createRating({
        subject: { uri: data.userstyle.uri, cid: data.userstyle.cid! },
        rating: value,
      });
      applyRatingToSummary(undefined, value);
      myRating = { uri: created.response.uri as CanonicalResourceUri, value: created.record };
    }
    applyRatingPatchToComments(value);
  }
</script>

<Meta
  title={userstyle.title}
  description={userstyle.description ||
    `${userstyle.title}, a userstyle shared on userstyles.club.`}
  image={ogImage}
  imageAlt={userstyle.title}
/>
<svelte:head>
  <meta name="at:canonical" content={data.userstyle.uri} />
</svelte:head>

<div class="page-wrapper">
  <div class="style-layout">
    <div class="style-main">
      {#if userstyle.previewImage}
        <div class="style-preview grid-background">
          <PreviewImage
            src={getBlobCdnUrl(data.profile.did, userstyle.previewImage, 'feed_fullsize')}
            alt={userstyle.title}
          />
        </div>
      {/if}

      <div class="style-identity">
        <h1 class="style-identity__title">{userstyle.title}</h1>
        <p class="style-identity__byline">
          by <ActorHandle profile={data.profile} style="minimal" /> · Updated
          <time>{formatDate(getLatestDate(userstyle))}</time>
        </p>
        {#if userstyle.description}
          <p class="style-identity__desc">{userstyle.description}</p>
        {/if}
      </div>
    </div>

    <aside class="style-sidebar">
      <div class="style-actions">
        <a
          href={installUrl}
          target="_blank"
          class="btn btn--primary btn--lg btn--full"
          onclick={onInstallClick}
        >
          <DownloadIcon size={16} />Install
        </a>
        {#if userstyle.homepageUrl}
          <a
            href={userstyle.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn--outline btn--lg btn--full"
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
            class="btn btn--secondary btn--lg btn--full"
          >
            <PencilIcon size={16} />Manage
          </a>
        {/if}
      </div>

      <div class="style-panel style-details">
        <h2 class="style-section-label">Details</h2>
        <div class="style-details__row">
          <span class="style-details__label">Published</span>
          <span class="style-details__value"
            ><time datetime={userstyle.createdAt}>{formatDate(userstyle.createdAt)}</time></span
          >
        </div>
        {#if userstyle.updatedAt}
          <div class="style-details__row">
            <span class="style-details__label">Updated</span>
            <span class="style-details__value"
              ><time datetime={userstyle.updatedAt}>{formatDate(userstyle.updatedAt)}</time></span
            >
          </div>
        {/if}
        {#if userstyle.license}
          <div class="style-details__row">
            <span class="style-details__label">License</span>
            <a
              class="style-details__value link link--sm"
              href="https://spdx.org/licenses/{userstyle.license}.html"
              target="_blank"
              rel="noopener noreferrer">{userstyle.license}<ScaleIcon size={10} /></a
            >
          </div>
        {/if}
        {#if version}
          <div class="style-details__row">
            <span class="style-details__label">Version</span>
            <span class="style-details__value">{version}</span>
          </div>
        {/if}
        {#if sourceCode !== undefined}
          <div class="style-details__row">
            <span class="style-details__label">Size</span>
            <span class="style-details__value">{bytes(byteCount)} · {lineCount} lines</span>
          </div>
        {/if}
        {#if data.userstyle.extras?.userCssVars}
          <div class="style-details__row">
            <span class="style-details__label">Options</span>
            <span class="style-details__value">{data.userstyle.extras.userCssVars}</span>
          </div>
        {/if}
        {#if userstyle.upstreamUrl}
          <div class="style-details__row">
            <span class="style-details__label">Upstream</span>
            <a
              class="style-details__value link link--sm style-details__value--truncate"
              href={userstyle.upstreamUrl}
              target="_blank"
              rel="noopener noreferrer">{userstyle.upstreamUrl}</a
            >
          </div>
        {/if}
        <div class="style-details__row">
          <span class="style-details__label">Record</span>
          <span class="style-details__value style-details__record-actions">
            <a
              class="link link--sm link--icon"
              href="https://pds.ls/{data.userstyle.uri}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View raw record on PDSls"
            >
              <ExternalLinkIcon size={12} /> pds.ls
            </a>
            <button
              type="button"
              class="style-details__copy-btn"
              aria-label="Copy record URI"
              onclick={copyAtUri}
            >
              {#if atUriCopied}
                <CheckIcon size={13} />
              {:else}
                <CopyIcon size={13} />
              {/if}
            </button>
          </span>
        </div>
      </div>

      {#if domains.length > 0}
        <div class="style-domain-list">
          {#each domains as domain (domain)}
            <Badge>{domain}</Badge>
          {/each}
        </div>
      {/if}
    </aside>
  </div>

  <div class="style-source">
    <h2 class="style-section-label">Source</h2>
    {#if sourceCode === undefined}
      <Alert variant="error"
        >Couldn't load the source code for this userstyle. It may be temporarily unavailable. Please
        reload or try again later.</Alert
      >
    {:else}
      <CssPreview source={sourceCode} />
    {/if}
  </div>

  <div class="page-wrapper__comments">
    <Comments
      userstyle={{ uri: data.userstyle.uri, cid: data.userstyle.cid! }}
      owner={data.profile.did}
      threads={comments.threads}
      {commentCount}
      {ratingSummary}
      {myRating}
      onRatingSubmit={submitRatingChange}
      {onCommentAdded}
      {onCommentDeleted}
      {onCommentEdited}
    />
  </div>
</div>

<Dialog
  bind:open={stylusDialog.open}
  title={stylusDialog.step === 'ask' ? 'Do you have Stylus?' : 'Stylus installed?'}
>
  {#snippet children()}
    <div class="stylus-dialog__body">
      {#if stylusDialog.step === 'ask'}
        <p>
          Userstyles are installed using the <img
            class="stylus-dialog__icon"
            alt="Stylus extension logo"
            src={StylusIcon}
          /><strong>Stylus</strong> browser extension. Get Stylus below before installing.
        </p>
      {:else}
        <p>Once Stylus is installed, continue below to install this userstyle.</p>
      {/if}
    </div>
  {/snippet}
  {#snippet actions()}
    {#if stylusDialog.step === 'ask'}
      <button class="btn btn--outline" type="button" onclick={continueToInstall}>
        Already have it!
      </button>
      <a
        href="https://add0n.com/stylus.html"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn--stylus"
        onclick={onGetStylusClick}
      >
        <ExternalLinkIcon size={16} />Get Stylus
      </a>
    {:else}
      <button class="btn btn--primary" type="button" onclick={continueToInstall}>
        <ArrowRightIcon size={16} /> Install
      </button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .style-layout {
    display: flex;
    align-items: flex-start;
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .style-main {
    flex: 2 1 0;
    min-width: 20rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .style-sidebar {
    flex: 1 1 0;
    min-width: 16rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .style-source {
    margin-top: var(--space-6);
  }

  .style-section-label {
    font-size: var(--text-lg);
    margin-bottom: var(--space-3);
  }

  .style-panel {
    background: var(--card-bg);
    border-radius: var(--radius);
    padding: var(--space-4);
  }

  .style-preview {
    border-radius: var(--radius);
    overflow: hidden;
    --grid-background-accent: var(--brand-purple);
  }

  .style-identity {
    .style-identity__title {
      font-size: var(--text-4xl);
    }

    .style-identity__byline {
      margin-top: var(--space-2);
      font-size: var(--text-sm);
      color: var(--fg-muted);

      time {
        font-weight: 600;
      }
    }

    .style-identity__desc {
      margin-top: var(--space-3);
      color: var(--fg-muted);
      line-height: 1.6;
    }
  }

  .style-domain-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-2);
  }

  .style-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    .btn--full {
      width: 100%;
    }
  }

  .style-details {
    .style-details__row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--border);
      font-size: var(--text-sm);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
    }

    .style-details__label {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--fg-muted);
      flex-shrink: 0;
    }

    .style-details__value {
      font-weight: 700;
      text-align: right;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);

      &.style-details__value--truncate {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &.style-details__record-actions {
        gap: var(--space-2);
      }
    }

    .style-details__copy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      padding: 0;
      color: var(--fg-muted);
      cursor: pointer;

      &:hover {
        color: var(--brand-purple);
      }
    }
  }

  .stylus-dialog__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    .stylus-dialog__icon {
      width: 1em;
      height: 1em;
      vertical-align: -0.15em;
      margin-right: 0.25em;
      border-radius: var(--radius-sm);
    }
  }
</style>
