<script lang="ts">
  import { joinPageTitle } from '$lib/constants';

  import { listAllUserstyles } from '$lib/at';

  import { Spinner, Alert } from '$components/ui';
  import { UserstylesSection } from '$components';

  let userstyles = listAllUserstyles();
</script>

<svelte:head>
  <title>{joinPageTitle('Explore')}</title>
</svelte:head>

<div class="page-section">
  <h1>Explore</h1>
</div>
{#await userstyles}
  <div class="loading-state"><Spinner /></div>
{:then userstyles}
  <UserstylesSection {userstyles}>
    {#snippet empty()}<p>No userstyles published yet.</p>{/snippet}
  </UserstylesSection>
{:catch error}
  <Alert variant="error">{error}</Alert>
{/await}

<style>
  .loading-state {
    display: flex;
    justify-content: center;
    padding: var(--space-8) 0;
  }
</style>
