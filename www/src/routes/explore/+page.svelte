<script lang="ts">
  import { joinPageTitle } from '$lib/constants';

  import { listAllUserstyles, type UserstyleRecord } from '$lib/at/services/userstyles';

  import { UserstylesSection } from '$components';

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

<div class="page-section">
  <h1>Explore</h1>
</div>
<UserstylesSection {userstyles} {loading} {error}>
  {#snippet empty()}<p>No userstyles published yet.</p>{/snippet}
</UserstylesSection>
