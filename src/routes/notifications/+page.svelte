<script lang="ts">
  import type { Did } from '@atcute/lexicons';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { joinPageTitle } from '$lib/constants';
  import { preferences } from '$lib/preferences.svelte';
  import { PaginatedList } from '$lib/pagination.svelte';
  import { formatDateTime, formatDateTimeRelative } from '$lib/date';
  import { labelForNotification, hrefForNotification } from '$lib/notifications';

  import {
    user,
    listNotifications,
    getProfiles,
    type NotificationView,
    type ProfileView,
  } from '$lib/at';

  import { Alert, Loading, Spinner } from '$components/ui';
  import { ActorHandle } from '$components';

  const list = new PaginatedList<NotificationView>();
  let profiles = $state(new Map<Did, ProfileView>());

  $effect(() => {
    if (!user.isInitializing && !user.isLoggedIn) {
      goto(resolve('/login'));
    }
  });

  async function fetchPage(cursor?: string) {
    if (!user.isLoggedIn || !user.did) return { items: [], cursor: undefined };
    const page = await listNotifications(user.did, { cursor });
    const dids = [...new Set(page.notifications.map((n) => n.author))];
    const resolved = await getProfiles(dids);
    profiles = new Map([...profiles, ...resolved]);
    return { items: page.notifications, cursor: page.cursor };
  }

  $effect(() => {
    if (user.isLoggedIn) {
      list.load(fetchPage, { reset: true }).then(() => {
        preferences.set('lastViewedNotificationsAt', new Date().toISOString());
      });
    }
  });

  function loadMore() {
    list.load(fetchPage);
  }
</script>

<svelte:head>
  <title>{joinPageTitle('Notifications')}</title>
</svelte:head>

<div class="page-section">
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
      <li>
        <a href={hrefForNotification(n, profile)} class="notification-row">
          <ActorHandle {profile} style="small" />
          <span class="notification-row__label">{labelForNotification(n.reason)}</span>
          <time
            class="notification-row__date"
            datetime={n.indexedAt}
            title={formatDateTime(n.indexedAt)}>{formatDateTimeRelative(n.indexedAt)}</time
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
    transition: opacity var(--ease-fast);

    &:hover {
      opacity: 0.85;
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
