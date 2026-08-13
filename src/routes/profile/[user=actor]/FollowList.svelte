<script lang="ts">
  import type { Did } from '@atcute/lexicons';
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { getPreferredActorIdentifier, formatActorLabel } from '$lib/preferences.svelte';
  import { PaginatedList } from '$lib/pagination.svelte';

  import { type FollowView, type ProfileView } from '$lib/at';
  import { fetchFollowPage } from './followList';

  import { BackLink, Loading, Alert, Spinner } from '$components/ui';
  import { ActorHandle, Meta } from '$components';

  interface Props {
    profile: ProfileView;
    kind: 'followers' | 'following';
    // First page fetched server-side.
    initial?: { items: FollowView[]; cursor?: string; profiles: Map<Did, ProfileView> };
  }

  let { profile, kind, initial }: Props = $props();

  let title = $derived(kind === 'followers' ? 'Followers' : 'Following');

  const list = new PaginatedList<FollowView>(untrack(() => initial));
  let profiles = $state(untrack(() => initial?.profiles ?? new Map<Did, ProfileView>()));

  async function fetchPage(cursor?: string) {
    const page = await fetchFollowPage(profile.did, kind, cursor);
    profiles = new Map([...profiles, ...page.profiles]);
    return { items: page.items, cursor: page.cursor };
  }

  // Skips the first effect run when seeded, so the server-fetched initial page isn't immediately discarded.
  let skipNextLoad = untrack(() => !!initial);

  $effect(() => {
    profile.did;
    kind;
    if (skipNextLoad) {
      skipNextLoad = false;
      return;
    }
    list.load(fetchPage, { reset: true });
  });

  function loadMore() {
    list.load(fetchPage);
  }
</script>

<Meta
  title={[title, formatActorLabel(profile)]}
  description={`${title} of ${formatActorLabel(profile)} on userstyles.club.`}
  image={profile.avatar}
  imageAlt={formatActorLabel(profile)}
  imageSize="small"
  type="profile"
/>

<div class="page-section">
  <div class="page-header">
    <BackLink
      href={resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(profile) })}
      label={formatActorLabel(profile)}
    />
    <h1>{title}</h1>
  </div>
</div>

<div class="page-section">
  {#if list.loading}
    <div class="section-fill"><Spinner size="lg" /></div>
  {:else if list.error}
    <Alert variant="error">{list.error}</Alert>
  {:else if list.items.length === 0}
    <p class="text-muted">
      {kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
    </p>
  {:else}
    <ul class="follow-list list-reset" role="list">
      {#each list.items as follow (follow.did)}
        {@const p = profiles.get(follow.did)}
        <li class="follow-list__item">
          {#if p}<ActorHandle profile={p} />{:else}<Spinner size="sm" />{/if}
        </li>
      {/each}
    </ul>
    {#if list.hasMore}
      <div class="follow-list__load-more">
        <button
          type="button"
          class="btn btn--outline"
          disabled={list.loadingMore}
          onclick={loadMore}
        >
          <Loading pending={list.loadingMore} idle="Load more" active="Loading…" />
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .follow-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .follow-list__load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }
</style>
