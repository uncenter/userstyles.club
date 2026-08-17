<script lang="ts">
  import type { Did } from '@atcute/lexicons';
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

  import {
    type ProfileView,
    type FeedViewItem,
    user,
    getProfiles,
    getTimeline,
    authorOfFeedItem,
    subjectOfFeedItem,
  } from '$lib/at';
  import {
    getPreferredActorIdentifier,
    formatActorLabel,
    preferences,
    type RecentlyVisitedStyle,
  } from '$lib/preferences.svelte';
  import { PaginatedList } from '$lib/pagination.svelte';

  import { FeedItem } from '$components';
  import { Alert, Loading, Spinner } from '$components/ui';

  import { ClockIcon, ActivityIcon } from '@lucide/svelte';

  interface Props {
    // First page of the "following" feed, fetched server-side using the SSR session hint.
    initial?: { items: FeedViewItem[]; cursor?: string; profiles: Map<Did, ProfileView> };
  }

  let { initial }: Props = $props();

  let recentStyles = $derived(preferences.get('recentlyVisitedStyles'));

  function getLinkToStyle(entry: RecentlyVisitedStyle) {
    const { rkey } = parseCanonicalResourceUri(entry.uri);
    return resolve('/style/[user=actor]/[style=rkey]', {
      user: getPreferredActorIdentifier({ did: entry.authorDid, handle: entry.authorHandle }),
      style: rkey,
    });
  }

  type FeedType = 'global' | 'following';
  let timelineFeedType = $state<FeedType>(preferences.get('lastTimelineFeedType'));
  $effect(() => {
    preferences.set('lastTimelineFeedType', timelineFeedType);
  });

  const feed = new PaginatedList<FeedViewItem>(untrack(() => initial));
  let feedProfiles = $state(untrack(() => initial?.profiles ?? new Map<Did, ProfileView>()));

  function keyOfFeedItem(item: FeedViewItem, index: number): string {
    const uri =
      item.type === 'userstyle'
        ? item.userstyle?.uri
        : item.type === 'comment'
          ? item.comment?.uri
          : item.type === 'rating'
            ? item.rating?.uri
            : item.follow?.uri;
    return uri ?? String(index);
  }

  async function fetchFeedPage(cursor?: string) {
    const page = await getTimeline({
      actor: timelineFeedType === 'following' ? user.did! : undefined,
      cursor,
    });
    const dids = [
      ...new Set(
        page.feed
          .flatMap((item) => [authorOfFeedItem(item), subjectOfFeedItem(item)])
          .filter((did): did is Did => !!did),
      ),
    ];
    const resolved = await getProfiles(dids);
    feedProfiles = new Map([...feedProfiles, ...resolved]);
    return { items: page.feed, cursor: page.cursor };
  }

  // Skips the first effect run when seeded.
  let skipNextFeedLoad = untrack(() => !!initial);

  $effect(() => {
    timelineFeedType;
    user.did;
    if (skipNextFeedLoad) {
      skipNextFeedLoad = false;
      return;
    }
    feed.load(fetchFeedPage, { reset: true });
  });

  function loadMoreFeed() {
    feed.load(fetchFeedPage);
  }
</script>

{#snippet loading()}
  <div class="inline-loading"><Spinner size="md" /> Loading…</div>
{/snippet}

<div class="dashboard-layout">
  <aside class="dashboard-sidebar">
    <div class="dashboard-sidebar__section">
      <h2 class="section-heading"><ClockIcon size={16} /> Recents</h2>
      {#if recentStyles.length === 0}
        <p class="text-muted no-content">No recently visited styles yet.</p>
      {:else}
        {@const recents = recentStyles.slice(0, 6)}
        <ul class="style-list list-reset accent-cycle" role="list">
          {#each recents as entry (entry.uri)}
            <li class="style-list__item">
              <a href={getLinkToStyle(entry)} class="style-shortcut">
                <span class="style-shortcut__dot"></span>
                <span class="style-shortcut__title truncate-1">{entry.title}</span>
                <span class="style-shortcut__author"
                  >{formatActorLabel({ did: entry.authorDid, handle: entry.authorHandle })}</span
                >
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </aside>

  <div class="dashboard-main">
    <div class="dashboard-main__header">
      <h2 class="section-heading"><ActivityIcon size={16} /> Timeline</h2>
      <div class="feed-scope" role="group" aria-label="Timeline feed scope">
        <button
          type="button"
          class={[
            'btn',
            'btn--sm',
            timelineFeedType === 'following' ? 'btn--secondary' : 'btn--ghost',
          ]}
          onclick={() => (timelineFeedType = 'following')}>Following</button
        >
        <button
          type="button"
          class={[
            'btn',
            'btn--sm',
            timelineFeedType === 'global' ? 'btn--secondary' : 'btn--ghost',
          ]}
          onclick={() => (timelineFeedType = 'global')}>Global</button
        >
      </div>
    </div>
    {#if feed.loading}
      {@render loading()}
    {:else if feed.error}
      <Alert variant="error">{feed.error}</Alert>
    {:else if feed.items.length === 0}
      <p class="text-muted no-content">
        {timelineFeedType === 'following'
          ? 'Nobody you follow has been active yet.'
          : 'Nothing here yet.'}
      </p>
    {:else}
      <ul class="feed-list list-reset" role="list">
        {#each feed.items as item, i (keyOfFeedItem(item, i))}
          {@const authorDid = authorOfFeedItem(item)}
          {@const authorProfile = authorDid ? feedProfiles.get(authorDid) : undefined}
          {@const subjectDid = subjectOfFeedItem(item)}
          {@const subjectProfile = subjectDid ? feedProfiles.get(subjectDid) : undefined}
          {#if authorProfile && (!subjectDid || subjectProfile)}
            <FeedItem {item} author={authorProfile} subject={subjectProfile} />
          {/if}
        {/each}
      </ul>
      {#if feed.hasMore}
        <div class="feed-list__load-more">
          <button
            type="button"
            class="btn btn--outline"
            disabled={feed.loadingMore}
            onclick={loadMoreFeed}
          >
            <Loading pending={feed.loadingMore} idle="Load more" active="Loading…" />
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .dashboard-layout {
    display: flex;
    gap: var(--space-6);
    align-items: flex-start;
    flex-wrap: wrap;

    .dashboard-sidebar {
      flex: 1 1 0;
      min-width: 16rem;
      display: flex;
      flex-direction: column;
    }

    .dashboard-main {
      flex: 2 1 0;
      min-width: 20rem;
    }
  }

  .dashboard-sidebar__section {
    padding: var(--space-4);
    background: var(--card-bg);
    border-radius: var(--radius);
  }

  .style-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    > .style-list__item {
      .style-shortcut {
        background: var(--float-bg);
      }
    }
  }

  .style-shortcut {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--space-3);
    row-gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius);
    text-decoration: none;
    color: var(--foreground);
    transition: opacity var(--ease-fast);

    &:hover {
      opacity: 0.85;
    }

    .style-shortcut__dot {
      width: 0.55rem;
      height: 0.55rem;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--accent-cycle-color, var(--brand-purple));
    }

    .style-shortcut__title {
      font-weight: 700;
      flex: 1 1 auto;
      min-width: 8rem;
    }

    .style-shortcut__author {
      font-size: var(--text-sm);
      color: var(--fg-muted);
      flex-shrink: 0;
    }
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xl);
    font-weight: 700;
    margin-bottom: var(--space-4);
  }

  .no-content {
    padding: var(--space-2) 0;
  }

  .dashboard-main__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-bottom: var(--space-4);

    .section-heading {
      margin-bottom: 0;
    }
  }

  .feed-scope {
    display: flex;
    gap: 2px;
    padding: 2px;
    background: var(--bg-subtle);
    border-radius: var(--radius-sm);

    .btn--secondary {
      background: var(--float-bg);
    }

    .btn--ghost:hover {
      background: transparent;
      opacity: 0.7;
    }
  }

  .feed-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .feed-list__load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }
</style>
