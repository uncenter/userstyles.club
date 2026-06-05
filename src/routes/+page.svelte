<script lang="ts">
  import { resolve } from '$app/paths';
  import { type UserstyleRecord, user, listMyUserstyles } from '$lib/at';
  import { TAGLINE, joinPageTitle } from '$lib/constants';


  import UserstyleListing from '$components/UserstyleListing.svelte';
  import Alert from '$components/ui/Alert.svelte';
  import Spinner from '$components/ui/Spinner.svelte';
  import Logo from '$components/Logo.svelte';

  let userstyles = $state<UserstyleRecord[]>([]);

  let loading = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (user.isLoggedIn) {
      loadUserstyles();
    }
  });

  async function loadUserstyles() {
    loading = true;
    error = null;

    try {
      userstyles = await listMyUserstyles();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load userstyles.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{joinPageTitle()}</title>
</svelte:head>

{#if user.isLoggedIn}
  <div class="narrow-col">
    <div class="page-section">
      <h1>Your userstyles</h1>
    </div>
    <div class="page-section">
      {#if loading}
        <div class="loading-state"><Spinner /></div>
      {:else if error}
        <Alert variant="error">{error}</Alert>
      {:else if userstyles.length === 0}
        <p class="text-muted">
          No userstyles yet. <a href={resolve('/new')}>Create your first userstyle.</a>
        </p>
      {:else}
        <ul class="plain">
          {#each userstyles as userstyle}
            <li><UserstyleListing record={userstyle} /></li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
{:else}
  <div class="welcome">
    <div class="welcome-logo">
      <Logo height="5rem" />
    </div>
    <p class="welcome-tagline">{TAGLINE}</p>
    <div class="welcome-actions">
      <a href={resolve('/login')} class="btn btn-primary btn-lg">Get started</a>
      <a href={resolve('/explore')} class="btn btn-outline btn-lg">Explore styles</a>
    </div>
  </div>
{/if}

<style>
  .welcome {
    display: grid;
    gap: var(--space-6);
    padding: var(--space-12) var(--space-10);
    text-align: center;
    border: 2px solid var(--foreground);
    box-shadow: var(--shadow-md);
    filter: url('#rough');
    background: var(--lavender);
    margin-top: var(--space-6);

    .welcome-logo {
      display: flex;
      justify-content: center;
    }

    .welcome-tagline {
      font-size: var(--text-lg);
      color: var(--fg-muted);
      max-width: 36rem;
      margin-inline: auto;
      line-height: 1.6;
    }

    .welcome-actions {
      display: flex;
      gap: var(--space-4);
      justify-content: center;
      flex-wrap: wrap;
    }
  }
</style>
