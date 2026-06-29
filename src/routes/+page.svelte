<script lang="ts">
  import { user } from '$lib/at';
  import { joinPageTitle } from '$lib/constants';

  import Dashboard from './Dashboard.svelte';
  import Welcome from './Welcome.svelte';
</script>

<svelte:head>
  <title>{joinPageTitle()}</title>
</svelte:head>

{#if user.isLoggedIn}
  <Dashboard />
{:else}
  <Welcome />
{/if}
