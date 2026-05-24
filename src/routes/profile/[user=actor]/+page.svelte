<script lang="ts">
	import type { PageProps } from './$types';

  import UserstyleListing from '$components/UserstyleListing.svelte';

  let error = $state<string | null>(null);

  let { data }: PageProps = $props();
</script>

<section class="panel" style="padding: 1rem; display: grid; gap: 1rem;">
  <div style="display: flex; gap: 0.9rem; align-items: center;">
    {#if data.profile.avatar}
      <img src={data.profile.avatar} alt={data.profile.handle} class="avatar" />
    {:else}
      <div class="avatar" style="display: grid; place-items: center; font-weight: 700;">
        {data.profile.handle[0]?.toUpperCase() ?? '?'}
      </div>
    {/if}

    <div>
      <h1 style="margin: 0; font-size: 1.25rem;">{data.profile.displayName ?? data.profile.handle}</h1>
      <p class="muted" style="margin: 0.2rem 0 0;">@{data.profile.handle}</p>
    </div>
  </div>

  {#if data.profile.description}
    <p style="margin: 0; line-height: 1.55;">{data.profile.description}</p>
  {/if}
</section>

<section class="panel" style="display: grid; gap: 0.75rem;">
  {#if data.userstyles.length === 0}
    <p class="muted" style="margin: 0;">No userstyles yet.</p>
  {:else}
    {#if error}
      <p style="margin: 0; color: #fca5a5;">{error}</p>
    {:else}
      <ul class="plain">
        {#each data.userstyles as userstyle}
          <li style="margin-bottom: 0.9rem;">
            <UserstyleListing record={userstyle} />
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>



