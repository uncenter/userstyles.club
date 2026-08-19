<script lang="ts">
  import type { Did } from '@atcute/lexicons';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { preferences } from '$lib/preferences.svelte';
  import { PaginatedList } from '$lib/pagination.svelte';
  import { formatDateTime, formatDateTimeRelative } from '$lib/date';
  import { hrefForNotification, MARK_NOTIFICATIONS_READ_DELAY_MS } from '$lib/notifications';

  import {
    user,
    listNotifications,
    getProfiles,
    type NotificationView,
    type ProfileView,
  } from '$lib/at';

  import { Alert, Loading, Spinner } from '$components/ui';
  import { ActorHandle, NotificationLabel, Meta } from '$components';

  const list = new PaginatedList<NotificationView>();
  let profiles = $state(new Map<Did, ProfileView>());
  // Snapshot of the read cursor taken before this visit marks things read, so already-open rows keep their unread state.
  let viewedBefore = $state<string | undefined>(undefined);
  // Flips once the mark-read delay elapses, clearing unread highlighting in step with the bell dot.
  let hasMarkedRead = $state(false);
  let markReadTimeout: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (!user.isInitializing && !user.isLoggedIn) {
      goto(resolve('/login'));
    }
  });

  async function fetchPage(cursor?: string) {
    if (!user.isLoggedIn || !user.did) return { items: [], cursor: undefined };
    const page = await listNotifications(user.did, { cursor, hydrate: true });
    const dids = [...new Set(page.notifications.map((n) => n.author))];
    const resolved = await getProfiles(dids);
    profiles = new Map([...profiles, ...resolved]);
    return { items: page.notifications, cursor: page.cursor };
  }

  $effect(() => {
    if (!user.isLoggedIn) return;
    if (viewedBefore === undefined) viewedBefore = preferences.get('lastViewedNotificationsAt');

    let cancelled = false;
    list.load(fetchPage, { reset: true }).then(() => {
      if (cancelled) return;
      markReadTimeout = setTimeout(() => {
        preferences.set('lastViewedNotificationsAt', new Date().toISOString());
        hasMarkedRead = true;
      }, MARK_NOTIFICATIONS_READ_DELAY_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(markReadTimeout);
    };
  });

  function loadMore() {
    list.load(fetchPage);
  }
</script>

<Meta title="Notifications" description="Your notifications on userstyles.club." />

<div class="card">
  <h1>Notifications</h1>
</div>

{#if list.loading}
  <div class="section-fill"><Spinner size="lg" /></div>
{:else if list.error}
  <Alert variant="error">{list.error}</Alert>
{:else if list.items.length === 0}
  <p class="text-muted">No notifications yet.</p>
{:else}
  <ul class="notification-list list-reset" role="list">
    {#each list.items as n (n.recordUri)}
      {@const profile = profiles.get(n.author)!}
      {@const unread = !hasMarkedRead && viewedBefore !== undefined && n.indexedAt > viewedBefore}
      <li>
        <a
          href={hrefForNotification(n, profile)}
          class={['notification-row', unread && 'notification-row--unread']}
        >
          <ActorHandle {profile} style="small" />
          <span class="notification-row__label"><NotificationLabel notification={n} /></span>
          <time
            class="notification-row__date"
            datetime={n.createdAt}
            title={formatDateTime(n.createdAt)}>{formatDateTimeRelative(n.createdAt)}</time
          >
        </a>
      </li>
    {/each}
  </ul>
  {#if list.hasMore}
    <div class="notification-list__load-more">
      <button type="button" class="btn btn--outline" disabled={list.loadingMore} onclick={loadMore}>
        <Loading pending={list.loadingMore} idle="Load more" active="Loading…" />
      </button>
    </div>
  {/if}
{/if}

<style>
  .notification-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-top: var(--space-4);
  }

  .notification-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: var(--card-bg);
    border-radius: var(--radius);
    border: none;
    text-align: left;
    text-decoration: none;
    color: var(--foreground);
    font: inherit;
    cursor: pointer;
    transition:
      opacity var(--ease-fast),
      background-color 0.6s ease-out;

    &:hover {
      opacity: 0.85;
    }

    &.notification-row--unread {
      background: var(--float-bg);
    }

    .notification-row__label {
      color: var(--fg-muted);
    }

    .notification-row__date {
      margin-left: auto;
      font-size: var(--text-sm);
      color: var(--fg-muted);
    }
  }

  .notification-list__load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }
</style>
