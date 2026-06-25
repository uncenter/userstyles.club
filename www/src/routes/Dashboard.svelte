<script lang="ts">
  import { resolve } from '$app/paths';
  import { parseResourceUri } from '@atcute/lexicons/syntax';

  import {
    type UserstyleRecord,
    user,
    listMyUserstyles,
    listCommentsForStyle,
    listRatingsForStyle,
    getProfile,
    computeAverageRating,
    type CommentRecord,
  } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';
  import { formatDate } from '$lib/date';

  import { ActorHandle, StarRating } from '$components';
  import { Spinner } from '$components/ui';

  import { PlusIcon, UserIcon, CompassIcon } from '@lucide/svelte';

  type EnrichedComment = { style: UserstyleRecord; comment: CommentRecord };

  const userstyles = listMyUserstyles();
  const comments = userstyles.then((userstyles) => Promise.all(
    userstyles.map(async (style) => {
      const comments = await listCommentsForStyle(style.uri);
      const filtered = comments.filter((comment) => parseResourceUri(comment.uri).repo !== user.did); // filter out user's own comments
      return filtered.map((comment) => { return { style, comment }; });
    }),
  ).then((comments) => comments.flat().sort(
    (a: EnrichedComment, b: EnrichedComment) =>
      new Date(b.comment.value.updatedAt ?? b.comment.value.createdAt).getTime() -
      new Date(a.comment.value.updatedAt ?? a.comment.value.createdAt).getTime(),
  )));
  const ratings = userstyles.then((userstyles) => Promise.all(
    userstyles.map(async (style) => {
      const ratings = await listRatingsForStyle(style.uri);
      return ratings.map((rating) => { return { style, rating }})
    }),
  ).then((ratings) => ratings.flat()));

  function sortRecordsByCreation<R extends { value: { createdAt: string }}>(records: Array<R>): Array<R> {
    return records.toSorted((a, b) => new Date(b.value.createdAt).getTime() - new Date(a.value.createdAt).getTime());
  }

  function getLinkToUserOwnStyle(styleUri: string) {
    const { rkey } = parseResourceUri(styleUri);
    return resolve('/style/[user=actor]/[style=rkey]', { user: getPreferredActorIdentifier(user.profile!), style: rkey! });
  }
</script>

<div class="page-section dashboard-top">
  <div class="stat-strip">
    <div class="stat-card">
      <span class="stat-value">
        {#await userstyles}<Spinner size="md" />{:then userstyles}{userstyles.length}{/await}
      </span>
      <span class="stat-label">Styles</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">
        {#await comments}<Spinner size="md" />{:then comments}{comments.length}{/await}
      </span>
      <span class="stat-label">Comments</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">
        {#await ratings}
          <Spinner size="md" />
        {:then ratings}
          {@const computed = computeAverageRating(ratings.map((rating) => rating.rating))}
          {#if computed}
            {computed.average.toFixed(1)}<span class="stat-unit">/ 5</span>
          {:else}
            —
          {/if}
        {/await}
      </span>
      <span class="stat-label">Avg rating</span>
    </div>
  </div>

  <div class="quick-actions">
    <a href={resolve('/new')} class="btn btn-primary">
      <PlusIcon size={15} /> New Userstyle
    </a>
    {#if user.profile}
      <a
        href={resolve('/profile/[user=actor]', {
          user: getPreferredActorIdentifier(user.profile),
        })}
        class="btn btn-secondary"
      >
        <UserIcon size={15} /> Your Profile
      </a>
    {/if}
    <a href={resolve('/explore')} class="btn btn-outline">
      <CompassIcon size={15} /> Explore
    </a>
  </div>
</div>

<div class="page-section">
  <h2 class="section-heading">Recent comments</h2>
  {#await comments}
    <div class="section-loading"><Spinner size="md" /> Loading…</div>
  {:then comments}
    {#if comments.length === 0}
      <p class="text-muted no-content">No comments on your styles yet.</p>
    {:else}
      {@const recents = comments.slice(0, 5)}
      <ul class="comment-list" role="list">
        {#each recents as { style, comment } (comment.uri)}
          {@const did = parseResourceUri(comment.uri).repo}
          {@const commenter = await getProfile(did)}
          {@const rating = ratings.then((ratings) => ratings.find((rating) => rating.style.uri === style.uri && parseResourceUri(rating.rating.uri).repo! === did)?.rating)}
          <li class="comment-row">
            <div class="comment-row-header">
              <ActorHandle profile={commenter} style='small' />
              <span class="comment-on">commented on <a href={getLinkToUserOwnStyle(style.uri)} class="style-link">{style.value.title}</a></span>
              <div class="comment-row-header-end">
                {#await rating then rating}
                  <StarRating value={rating?.value.rating} />
                {/await}
                <time class="comment-date">{formatDate(comment.value.updatedAt ?? comment.value.createdAt)}</time>
              </div>
            </div>
            <p class="comment-content">{comment.value.comment}</p>
          </li>
        {/each}
      </ul>
    {/if}
  {/await}
</div>

<div class="page-section">
  <h2 class="section-heading">Your styles</h2>
  {#await userstyles}
    <div class="section-loading"><Spinner size="sm" /> Loading…</div>
  {:then userstyles}
    {#if userstyles.length === 0}
      <p class="text-muted no-content">
        No userstyles yet. <a href={resolve('/new')}>Create your first.</a>
      </p>
    {:else}
      {@const recents = sortRecordsByCreation(userstyles).slice(0, 6)}
      <ul class="style-scroll" role="list">
        {#each recents as style (style.uri)}
          <li class="style-scroll-item">
            <a href={getLinkToUserOwnStyle(style.uri)} class="style-scroll-card">
              <span class="style-card-title">{style.value.title}</span>
              {#if style.value.description}
                <span class="style-card-desc">{style.value.description}</span>
              {/if}
              <time class="style-card-date">
                {formatDate(style.value.updatedAt ?? style.value.createdAt)}
              </time>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/await}
</div>

<style>
  .dashboard-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
    flex-wrap: wrap;

    .stat-strip {
      display: flex;
      gap: var(--space-6);
      flex-wrap: wrap;

      .stat-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        background: var(--background);
        border-radius: var(--radius);
        padding: var(--space-4) var(--space-5);
        min-width: 8rem;

        .stat-value {
          font-size: var(--text-3xl);
          font-weight: 800;
          color: var(--foreground);
          line-height: 1;
          display: flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 2.25rem;

          .stat-unit {
            font-size: var(--text-base);
            font-weight: 600;
            color: var(--fg-muted);
          }
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--fg-muted);
          font-weight: 500;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .section-heading {
    font-size: var(--text-xl);
    font-weight: 700;
    margin-bottom: var(--space-4);
  }

  .section-loading {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--fg-muted);
    font-size: var(--text-sm);
  }

  .no-content {
    padding: var(--space-2) 0;
  }

  .comment-list {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0;

    .comment-row {
      padding: var(--space-3) 0;
      border-top: 1px solid var(--border);

      &:last-child {
        border-bottom: 1px solid var(--border);
      }

      .comment-row-header {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        flex-wrap: wrap;
        margin-bottom: var(--space-2);

        .comment-on {
          color: var(--fg-muted);
        }

        .style-link {
          color: var(--brand-purple);
          font-weight: 600;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        .comment-row-header-end {
          margin-left: auto;
          display: flex;
          flex-direction: row;
          gap: var(--space-2);
        }

        .comment-date {
          font-size: var(--text-sm);
          color: var(--fg-muted);
        }
      }

      .comment-content {
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .style-scroll {
    display: flex;
    gap: var(--space-3);
    overflow-x: auto;
    padding-bottom: var(--space-2);
    list-style: none;
    margin: 0;
    padding-inline: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;

    .style-scroll-item {
      flex-shrink: 0;
      display: flex;

      &:nth-child(4n + 1) { --card-accent-color: var(--brand-purple); }
      &:nth-child(4n + 2) { --card-accent-color: var(--brand-red); }
      &:nth-child(4n + 3) { --card-accent-color: var(--brand-green); }
      &:nth-child(4n + 4) { --card-accent-color: var(--brand-blue); }

      .style-scroll-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        width: 11rem;
        height: 100%;
        padding: var(--space-3) var(--space-4);
        background: var(--background);
        border-top: 4px solid var(--card-accent-color, var(--brand-purple));
        border-radius: var(--radius);
        text-decoration: none;
        color: var(--foreground);
        transition: opacity var(--ease-fast);

        &:hover {
          opacity: 0.85;
        }

        .style-card-title {
          font-weight: 700;
          line-height: 1.3;
          /* Workaround for https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp. */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-clamp: 2;
          overflow: hidden;
        }

        .style-card-desc {
          font-size: var(--text-sm);
          color: var(--fg-muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-clamp: 2;
          overflow: hidden;
          flex: 1;
        }

        .style-card-date {
          font-size: var(--text-xs);
          color: var(--fg-muted);
          margin-top: auto;
          padding-top: var(--space-1);
        }
      }
    }
  }
</style>
