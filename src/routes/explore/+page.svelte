<script lang="ts">
  import { joinPageTitle } from '$lib/constants';

  import { listAllUserstyles, type UserstyleRecord } from '$lib/at/services/userstyles';

  import { Spinner, Alert, UserstyleListing } from '$components';

  let userstyles = $state<UserstyleRecord[]>([]);

  let loading = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    loadUserstyles();
  });

  async function loadUserstyles() {
    loading = true;
    error = null;

    try {
      userstyles = await listAllUserstyles();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load userstyles.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
	<title>{joinPageTitle('Explore')}</title>
</svelte:head>

<div class="narrow-col">
  <div class="page-section">
    <h1>Explore</h1>
  </div>
  <div class="page-section">
    {#if loading}
      <div class="loading-state"><Spinner /></div>
    {:else if error}
      <Alert variant="error">{error}</Alert>
    {:else if userstyles.length === 0}
      <p class="text-muted">No userstyles published yet.</p>
    {:else}
      <ul class="plain">
        {#each userstyles as userstyle}
          <li><UserstyleListing record={userstyle} /></li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
