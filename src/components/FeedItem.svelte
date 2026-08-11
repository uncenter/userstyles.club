<script lang="ts">
  import { resolve } from '$app/paths';
  import { parseCanonicalResourceUri } from '@atcute/lexicons';
  import type { FeedViewItem, ProfileView } from '$lib/at';

  import ActorHandle from './ActorHandle.svelte';
  import StarRating from './StarRating.svelte';

  import { formatDateTime, formatDateTimeRelative } from '$lib/date';
  import { getLatestDate } from '$lib/at/utils';

  interface Props {
    item: FeedViewItem;
    author: ProfileView;
  }

  let { item, author }: Props = $props();

  let date = $derived<string>(
    getLatestDate(item.userstyle ?? item.comment ?? item.rating!),
  );

  let styleHref = $derived.by(() => {
    const uri =
      item.type === 'userstyle'
        ? item.userstyle?.uri
        : item.type === 'comment'
          ? item.comment?.subjectUri
          : item.rating?.subjectUri;
    if (!uri) return undefined;
    const { repo, rkey } = parseCanonicalResourceUri(uri);
    return resolve('/style/[user=actor]/[style=rkey]', { user: repo, style: rkey });
  });
</script>

<li class="feed-item">
  <div class="feed-item__header">
    <ActorHandle profile={author} style="small" />
    <span class="feed-item__action">
      {#if item.type === 'userstyle'}
        published
      {:else if item.type === 'comment'}
        commented on
      {:else}
        rated
      {/if}
      {#if styleHref}
        <a href={styleHref} class="link link--quiet feed-item__style-link"
          >{item.userstyle?.title ?? 'a userstyle'}</a
        >
      {/if}
    </span>
    <time class="feed-item__date" datetime={date} title={formatDateTime(date)}
      >{formatDateTimeRelative(date)}</time
    >
  </div>
  {#if item.type === 'comment' && item.comment}
    <p class="feed-item__content truncate-2">{item.comment.comment}</p>
  {:else if item.type === 'rating' && item.rating}
    <div class="feed-item__content"><StarRating value={item.rating.rating} /></div>
  {:else if item.type === 'userstyle' && item.userstyle?.description}
    <p class="feed-item__content truncate-2">{item.userstyle.description}</p>
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
      margin-bottom: var(--space-2);

      .feed-item__action {
        color: var(--fg-muted);
      }

      .feed-item__style-link {
        font-weight: 600;
      }

      .feed-item__date {
        margin-left: auto;
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }
    }

    .feed-item__content {
      line-height: 1.5;
      margin: 0;
    }
  }
</style>
