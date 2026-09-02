<script lang="ts">
  import type { PageProps } from './$types';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { Meta, UserstyleBrowser } from '$components';

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

<Meta
  title={query.trim() ? [`"${query.trim()}"`, 'Explore'] : 'Explore'}
  description={query.trim()
    ? `Userstyles matching "${query.trim()}" on userstyles.club.`
    : 'Discover userstyles shared on userstyles.club.'}
/>

<div class="card">
  <h1>Explore</h1>
</div>
<UserstyleBrowser bind:query bind:sort initial={data.initial} />
