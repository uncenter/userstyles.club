<script lang="ts">
  import type { PageProps } from './$types';

  import UserstyleListing from '$components/UserstyleListing.svelte';
  import Alert from '$components/ui/Alert.svelte';
  import Avatar from '$components/ui/Avatar.svelte';

  let error = $state<string | null>(null);

  let { data }: PageProps = $props();
</script>

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

  <section class="page-section">
    {#if error}
      <Alert variant="error">{error}</Alert>
    {:else if data.userstyles.length === 0}
      <p class="text-muted">No userstyles yet.</p>
    {:else}
      <ul class="plain">
        {#each data.userstyles as userstyle}
          <li><UserstyleListing record={userstyle} /></li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
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
