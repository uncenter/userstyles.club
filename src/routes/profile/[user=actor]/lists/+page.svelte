<script lang="ts">
  import { untrack } from 'svelte';
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import { getPreferredActorIdentifier, formatActorLabel } from '$lib/preferences.svelte';
  import { PaginatedList } from '$lib/pagination.svelte';

  import { getLists, type ListView } from '$lib/at';

  import { BackLink, Loading, Alert, Spinner } from '$components/ui';
  import { ListsSection, Meta } from '$components';

  let { data }: PageProps = $props();

  const list = new PaginatedList<ListView>(untrack(() => data.initial));

  async function fetchPage(cursor?: string) {
    const page = await getLists(data.profile.did, { cursor });
    return { items: page.lists, cursor: page.cursor };
  }

  let skipNextLoad = untrack(() => !!data.initial);

  $effect(() => {
    data.profile.did;
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
  title={['Lists', formatActorLabel(data.profile)]}
  description={`Lists created by ${formatActorLabel(data.profile)} on userstyles.club.`}
  image={data.profile.avatar}
  imageAlt={formatActorLabel(data.profile)}
  imageSize="small"
  type="profile"
/>

<div class="card">
  <div class="page-header">
    <BackLink
      href={resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(data.profile) })}
      label={formatActorLabel(data.profile)}
    />
    <h1>Lists</h1>
  </div>
</div>

{#if list.loading}
  <div class="section-fill"><Spinner size="lg" /></div>
{:else if list.error}
  <Alert variant="error">{list.error}</Alert>
{:else}
  <ListsSection lists={list.items} owner={data.profile}>
    {#snippet empty()}No lists yet.{/snippet}
  </ListsSection>
  {#if list.hasMore}
    <div class="lists-load-more">
      <button type="button" class="btn btn--outline" disabled={list.loadingMore} onclick={loadMore}>
        <Loading pending={list.loadingMore} idle="Load more" active="Loading…" />
      </button>
    </div>
  {/if}
{/if}

<style>
  .lists-load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }
</style>
