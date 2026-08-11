<script lang="ts">
  import { searchUserstyles, type UserstyleView } from '$lib/at';
  import { PaginatedList } from '$lib/pagination.svelte';

  import UserstylesSection from './UserstylesSection.svelte';
  import { Alert, Loading, Spinner } from './ui';

  import { SearchIcon } from '@lucide/svelte';

  type Sort = 'latest' | 'popular' | 'top';

  interface Props {
    query?: string;
    sort?: Sort;
  }

  let { query = $bindable(''), sort = $bindable('latest') }: Props = $props();

  let searchInput = $state(query);

  const list = new PaginatedList<UserstyleView>();

  async function fetchPage(cursor?: string) {
    const page = await searchUserstyles({ query: query.trim() || undefined, sort, cursor });
    return { items: page.userstyles, cursor: page.cursor };
  }

  $effect(() => {
    list.load(fetchPage, { reset: true });
  });

  function submitSearch(event: Event) {
    event.preventDefault();
    query = searchInput;
  }

  function loadMore() {
    list.load(fetchPage);
  }
</script>

<div class="userstyle-browser">
  <div class="userstyle-browser__controls">
    <form class="form-input-group userstyle-browser__search" onsubmit={submitSearch}>
      <input
        type="text"
        class="form-input-group__input"
        placeholder="Search userstyles…"
        bind:value={searchInput}
      />
      <button type="submit" class="form-input-group__btn" aria-label="Search">
        <SearchIcon size={16} />
      </button>
    </form>
    <div class="userstyle-browser__sort" role="group" aria-label="Sort by">
      <button
        type="button"
        class={['btn', 'btn--sm', sort === 'latest' ? 'btn--secondary' : 'btn--ghost']}
        onclick={() => (sort = 'latest')}>Latest</button
      >
      <button
        type="button"
        class={['btn', 'btn--sm', sort === 'popular' ? 'btn--secondary' : 'btn--ghost']}
        onclick={() => (sort = 'popular')}>Popular</button
      >
      <button
        type="button"
        class={['btn', 'btn--sm', sort === 'top' ? 'btn--secondary' : 'btn--ghost']}
        disabled={!query.trim()}
        title={query.trim() ? undefined : 'Search for something to rank by relevance'}
        onclick={() => (sort = 'top')}>Top</button
      >
    </div>
  </div>

  {#if list.loading}
    <div class="section-fill"><Spinner size="lg" /></div>
  {:else if list.error}
    <Alert variant="error">{list.error}</Alert>
  {:else}
    <UserstylesSection userstyles={list.items}>
      {#snippet empty()}<p>No userstyles found.</p>{/snippet}
    </UserstylesSection>
    {#if list.hasMore}
      <div class="userstyle-browser__load-more">
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
  .userstyle-browser {
    .userstyle-browser__controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }

    .userstyle-browser__search {
      flex: 1 1 16rem;
      max-width: 24rem;
    }

    .userstyle-browser__sort {
      display: flex;
      gap: var(--space-1);
    }

    .userstyle-browser__load-more {
      display: flex;
      justify-content: center;
      margin-top: var(--space-2);
    }
  }
</style>
