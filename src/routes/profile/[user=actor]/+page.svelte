<script lang="ts">
	import type { PageProps } from './$types';

  import UserstyleListing from '$components/UserstyleListing.svelte';

  let error = $state<string | null>(null);

  let { data }: PageProps = $props();
</script>

<div class="row">
  <section class="card col-10 offset-1">
    <div>
      {#if data.profile.avatar}
        <figure data-variant="avatar" class="large" aria-label="Jane Doe">
          <img src={data.profile.avatar} alt={data.profile.handle} />
        </figure>
      {/if}

      <div>
        <h1>{data.profile.displayName ?? data.profile.handle}</h1>
        <p class="text-light">@{data.profile.handle}</p>
      </div>
    </div>

    {#if data.profile.description}
      <p style="margin: 0; line-height: 1.55;">{data.profile.description}</p>
    {/if}
  </section>
</div>

<div class="row">
  <section class="card col-10 offset-1">
    {#if data.userstyles.length === 0}
      <p class="text-light">No userstyles yet.</p>
    {:else if error}
      <div role="alert" data-variant="error">
        <strong>Error!</strong> {error}
      </div>
    {:else}
      <div class="list">
        {#each data.userstyles as userstyle}
          <UserstyleListing record={userstyle} />
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
