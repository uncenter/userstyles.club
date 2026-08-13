<script lang="ts">
  import { user } from '$lib/at';

  import { Meta } from '$components';
  import Dashboard from './Dashboard.svelte';
  import Welcome from './Welcome.svelte';
</script>

<Meta />

{#if user.isLoggedIn}
  <Dashboard />
{:else}
  <Welcome />
{/if}
