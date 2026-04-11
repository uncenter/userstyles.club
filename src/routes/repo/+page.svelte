  <script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { listRepoCollection, loadRepoCollectionPreviews, type RepoCollectionPreview, user } from '$lib/at';

    type CollectionGroup = RepoCollectionPreview & {
      loadingMore?: boolean;
    };

  const INITIAL_LIMIT = 10;
  const LOAD_MORE_LIMIT = 25;

  let loading = $state(false);
  let error = $state<string | null>(null);
  let collections = $state<CollectionGroup[]>([]);
  let discovered = $state<string[]>([]);

  $effect(() => {
    if (!user.isLoggedIn || !user.did) {
      goto('/login');
      return;
    }
    loadRepoExplorer();
  });

  function getPdslsUrl(uri: string) {
    return `https://pdsls.dev/${uri}`;
  }

  function getRkeyFromUri(uri: string) {
    return uri.split('/').pop() ?? '';
  }

  async function loadRepoExplorer() {
    if (!user.did) return;

    loading = true;
    error = null;
    collections = [];
    discovered = [];

      try {
        const data = await loadRepoCollectionPreviews(user.did, INITIAL_LIMIT);
        discovered = data.collections;
        collections = data.previews;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load repo explorer';
    } finally {
      loading = false;
    }
  }

  async function loadMore(collectionName: string) {
    if (!user.did) return;
    const index = collections.findIndex((item) => item.collection === collectionName);
    if (index === -1) return;

    const group = collections[index];
    if (!group.cursor || group.loadingMore) return;

    group.loadingMore = true;
    group.error = undefined;
    collections = [...collections];

      try {
        const data = await listRepoCollection({
          repo: user.did,
          collection: group.collection,
          limit: LOAD_MORE_LIMIT,
          cursor: group.cursor
        });
        group.records = [...group.records, ...data.records];
        group.cursor = data.cursor;
        group.hasMore = data.hasMore;
      } catch (e) {
        group.error = e instanceof Error ? e.message : 'Failed to load more records.';
      } finally {
        group.loadingMore = false;
      collections = [...collections];
    }
  }
</script>

<main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  <header class="panel">
    <h1 class="section-title">Repo explorer</h1>
  </header>

  <section class="panel">
    <div class="actions">
      <a href="{base}/" class="btn">Home</a>
      <button type="button" class="btn" onclick={loadRepoExplorer} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </section>

  <section class="panel">
    <p style="margin: 0 0 0.4rem;"><strong>DID:</strong> <code>{user.did}</code></p>
    <p class="muted" style="margin: 0;">
      Shows discovered collections and records per collection. Each record links to <code>pdsls.dev</code>.
    </p>
  </section>

  {#if loading}
    <section class="panel">Loading repo data...</section>
  {:else if error}
    <section class="panel" style="color: #b00020;">{error}</section>
  {:else}
    <section class="panel">
      <p style="margin: 0 0 0.45rem;"><strong>Collections discovered:</strong> {discovered.length}</p>
      {#if discovered.length > 0}
        <ul class="plain">
          {#each discovered as collection}
            <li><code>{collection}</code></li>
          {/each}
        </ul>
      {:else}
        <p class="muted" style="margin: 0;">No collections found.</p>
      {/if}
    </section>

    {#each collections as group}
      <section class="panel" style="display: grid; gap: 0.55rem;">
        <h2 style="margin: 0; font-size: 1rem;"><code>{group.collection}</code></h2>
        <p class="muted" style="margin: 0;">{group.records.length} loaded</p>

        {#if group.error}
          <p style="margin: 0; color: #b00020;">{group.error}</p>
        {:else if group.records.length === 0}
          <p class="muted" style="margin: 0;">No records in this collection.</p>
        {:else}
          <ul class="plain">
            {#each group.records as record}
              <li>
                <p style="margin: 0; overflow-wrap: anywhere;"><code>{record.uri}</code></p>
                <p class="muted" style="margin: 0.15rem 0;">rkey: <code>{getRkeyFromUri(record.uri)}</code></p>
                <p style="margin: 0.1rem 0 0.45rem;">
                  <a href={getPdslsUrl(record.uri)} target="_blank" rel="noopener noreferrer">Open in pdsls</a>
                </p>
              </li>
            {/each}
          </ul>

          {#if group.hasMore}
            <p style="margin: 0.3rem 0 0;">
              <button type="button" class="btn" onclick={() => loadMore(group.collection)} disabled={group.loadingMore}>
                {group.loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </p>
          {/if}
        {/if}
      </section>
    {/each}
  {/if}
</main>
