<script lang="ts">
  import type { PageProps } from './$types';
  import { joinPageTitle } from '$lib/constants';

  import { Alert, Avatar, UserstylesList } from '$components';

  let error = $state<string | null>(null);

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{joinPageTitle(`@${data.profile.handle}`)}</title>
</svelte:head>

<div class="narrow-col">
  <section class="page-section profile-header">
    <Avatar
      src={data.profile.avatar}
      alt={data.profile.handle}
      name={data.profile.displayName ?? data.profile.handle}
      size="lg"
    />
    <div class="profile-info">
      <h1>{data.profile.displayName ?? data.profile.handle}</h1>
      <p class="text-muted">@{data.profile.handle}</p>
    </div>
    {#if data.profile.description}
      <p class="profile-bio">{data.profile.description}</p>
    {/if}
  </section>
</div>

<section class="profile-userstyles">
  {#if error}
    <Alert variant="error">{error}</Alert>
  {:else if data.userstyles.length === 0}
    <p class="text-muted">No userstyles yet.</p>
  {:else}
    <UserstylesList userstyles={data.userstyles} />
  {/if}
</section>

<style>
  .profile-userstyles {
    margin-top: var(--space-6);
    margin-bottom: var(--space-5);
  }

  .profile-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--lavender);

    .profile-info {
      display: grid;
      gap: var(--space-1);

      h1 {
        font-size: var(--text-2xl);
      }
    }

    .profile-bio {
      color: var(--fg-muted);
      line-height: 1.6;
      margin-top: var(--space-1);
    }
  }
</style>
