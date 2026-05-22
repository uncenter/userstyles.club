<script lang="ts">
  import { listAllUserstyles, type UserstyleRecord } from '$lib/at/services/userstyles';

  import UserstyleListing from '$components/UserstyleListing.svelte';

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

<header class="panel">
  <h1 class="section-title">Explore</h1>
</header>

<section class="panel" style="display: grid; gap: 0.75rem;">
  {#if loading}
      <p style="margin: 0;">Loading userstyles...</p>
  {:else}
    <ul class="plain">
      {#each userstyles as userstyle}
        <li style="margin-bottom: 0.9rem;">
          <UserstyleListing record={userstyle} />
        </li>
      {/each}
    </ul>
  {/if}
</section>
