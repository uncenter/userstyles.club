<script lang="ts">
  import type { PageProps } from './$types';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { joinPageTitle } from '$lib/constants';

  import { UserstyleBrowser } from '$components';

  let { data }: PageProps = $props();

  let query = $derived(data.query);
  let sort = $derived(data.sort);

  $effect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (sort !== 'latest') params.set('sort', sort);
    const search = params.toString();
    replaceState(search ? `?${search}` : resolve('/search'), {});
  });
</script>

<svelte:head>
  <title>{joinPageTitle(query.trim() ? `Search: ${query.trim()}` : 'Search')}</title>
</svelte:head>

<div class="page-section">
  <h1>Search</h1>
</div>
<UserstyleBrowser bind:query bind:sort />
