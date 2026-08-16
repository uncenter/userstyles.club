<script lang="ts">
  import { resolve } from '$app/paths';
  import { parseCanonicalResourceUri } from '@atcute/lexicons';
  import { user, type FeedViewItem, type ProfileView } from '$lib/at';

  import ActorHandle from './ActorHandle.svelte';
  import StarRating from './StarRating.svelte';
  import StarRatingAverage from './StarRatingAverage.svelte';
  import { Avatar } from './ui';

  import { formatDateTime, formatDateTimeRelative } from '$lib/date';
  import { getLatestDate } from '$lib/at/utils';
  import { getPreferredActorIdentifier, formatActorLabel } from '$lib/preferences.svelte';

  interface Props {
    item: FeedViewItem;
    author: ProfileView;
    subject?: ProfileView;
  }

  let { item, author, subject }: Props = $props();

  let date = $derived<string>(
    getLatestDate(item.comment ?? item.rating ?? item.follow ?? item.userstyle!),
  );

  let styleHref = $derived.by(() => {
    const uri =
      item.type === 'userstyle'
        ? item.userstyle?.uri
        : item.type === 'comment'
          ? item.comment?.subjectUri
          : item.type === 'rating'
            ? item.rating?.subjectUri
            : undefined;
    if (!uri) return undefined;
    const { repo, rkey } = parseCanonicalResourceUri(uri);
    return resolve('/style/[user=actor]/[style=rkey]', { user: repo, style: rkey });
  });

  let profileHref = $derived(
    subject
      ? resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(subject) })
      : undefined,
  );

  let followedYou = $derived(item.type === 'follow' && item.follow?.subjectDid === user.did);

  let yourUserstyle = $derived(
    (item.type === 'comment' || item.type === 'rating') && item.userstyle?.author === user.did,
  );
</script>

<li class="feed-item">
  <div class="feed-item__header">
    <ActorHandle profile={author} style="small" />
    <span class="feed-item__action">
      {#if item.type === 'userstyle'}
        published a new userstyle
      {:else if item.type === 'comment'}
        commented on {yourUserstyle ? 'your userstyle' : 'a userstyle'}
      {:else if item.type === 'rating' && item.rating}
        rated <StarRating value={item.rating.rating} /> on {yourUserstyle
          ? 'your userstyle'
          : 'a userstyle'}
      {:else if item.type === 'rating'}
        rated {yourUserstyle ? 'your userstyle' : 'a userstyle'}
      {:else}
        followed {followedYou ? 'you' : 'a user'}
      {/if}
    </span>
    <time class="feed-item__date" datetime={date} title={formatDateTime(date)}
      >{formatDateTimeRelative(date)}</time
    >
  </div>

  {#if item.type === 'comment' && item.comment}
    <p class="feed-item__quote truncate-2">&ldquo;{item.comment.comment}&rdquo;</p>
  {/if}

  {#if item.type === 'follow' && subject}
    <a href={profileHref} class="feed-item__card feed-item__card--actor">
      <Avatar
        src={subject.avatar}
        name={formatActorLabel(subject)}
        alt={formatActorLabel(subject)}
        size="md"
      />
      <span class="feed-item__card-actor-info">
        <span class="feed-item__card-actor-name">{formatActorLabel(subject)}</span>
        {#if subject.description}
          <span class="feed-item__card-actor-bio truncate-1">{subject.description}</span>
        {/if}
      </span>
    </a>
  {:else if styleHref}
    <a href={styleHref} class="feed-item__card">
      <div class="feed-item__card-main">
        <span class="feed-item__card-title">{item.userstyle?.title ?? 'a userstyle'}</span>
        {#if item.userstyle?.description}
          <p class="feed-item__card-content feed-item__card-content--description truncate-2">
            {item.userstyle.description}
          </p>
        {/if}
      </div>
      <div class="feed-item__card-meta">
        <StarRatingAverage
          average={item.userstyle?.ratingAverage}
          count={item.userstyle?.ratingCount}
        />
      </div>
    </a>
  {/if}
</li>

<style>
  .feed-item {
    padding: var(--space-4);
    background: var(--card-bg);
    border-radius: var(--radius);

    .feed-item__header {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      flex-wrap: wrap;
      margin-bottom: var(--space-3);

      .feed-item__action {
        color: var(--fg-muted);
      }

      .feed-item__date {
        margin-left: auto;
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }
    }

    .feed-item__quote {
      margin: 0 0 var(--space-3) 0;
      padding-left: var(--space-3);
      border-left: 3px solid var(--border);
      color: var(--fg-muted);
      font-style: italic;
      line-height: 1.5;
    }

    .feed-item__card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--bg-subtle);
      border-radius: var(--radius);
      text-decoration: none;
      color: inherit;
      transition: opacity var(--ease-fast);

      &:hover {
        opacity: 0.85;
      }

      .feed-item__card-main {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        min-width: 0;
        flex: 1;
      }

      .feed-item__card-title {
        font-weight: 700;
        color: var(--foreground);
        align-self: flex-start;
      }

      .feed-item__card-content {
        line-height: 1.5;
        margin: 0;

        &.feed-item__card-content--description {
          color: var(--fg-muted);
          font-style: italic;
        }
      }

      .feed-item__card-meta {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      &.feed-item__card--actor {
        justify-content: flex-start;

        .feed-item__card-actor-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .feed-item__card-actor-name {
          font-weight: 700;
          font-family: var(--font-display);
        }

        .feed-item__card-actor-bio {
          font-size: var(--text-sm);
          color: var(--fg-muted);
        }
      }
    }
  }
</style>
