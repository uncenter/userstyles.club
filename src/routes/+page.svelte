<script lang="ts">
  import type { PageProps } from './$types';
  import { user } from '$lib/at';

  import { Meta } from '$components';
  import Dashboard from './Dashboard.svelte';
  import Welcome from './Welcome.svelte';

  let { data }: PageProps = $props();

  let showDashboard = $derived(user.isLoggedIn || (user.isInitializing && !!data.sessionHintDid));
</script>

<Meta />

{#if showDashboard}
  <Dashboard initial={data.initial} />
{:else}
  <Welcome />
{/if}
