<script lang="ts">
  import { resolve } from '$app/paths';
  import { type UserstyleRecord, user, listMyUserstyles } from '$lib/at';
  import { TAGLINE, joinPageTitle } from '$lib/constants';

  import { Wordmark, Logomark } from '$components/branding';
  import { UserstylesSection } from '$components';

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
  </div>
  <UserstylesSection {userstyles} {loading} {error}>
    {#snippet empty()}
      <p>No userstyles yet. <a href={resolve('/new')}>Create your first userstyle.</a></p>
    {/snippet}
  </UserstylesSection>
{:else}
  <div class="welcome">
    <div class="welcome-logo">
      <Wordmark --height="clamp(2rem, 10vw, 5rem)" />
    </div>
    <div class="welcome-spinner">
      <Logomark size="10rem" withArm withSpin />
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
    margin-top: var(--space-6);

    @media (max-width: 639px) {
      padding: var(--space-8) var(--space-4);
      gap: var(--space-4);
    }

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
