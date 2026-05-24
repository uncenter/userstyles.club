<script lang="ts">
	import type { PageProps } from './$types';
  import { resolve } from '$app/paths';

  import { user, deleteUserstyle } from '$lib/at';

  let deleting = $state(false);
  let error = $state<string | null>(null);

  let { data, params }: PageProps = $props();

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  async function removeUserstyle() {
    error = null;
    deleting = true;

    try {
      await deleteUserstyle(data.style);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete userstyle.';
    } finally {
      deleting = false;
    }
  }
</script>

<section class="panel" style="padding: 1rem; display: grid; gap: 1rem;">
  <div style="display: flex; gap: 0.9rem; align-items: center;">
    <div>
      <h1 style="margin: 0; font-size: 1.25rem;">{data.userstyle.title}</h1>
      <p class="muted" style="margin: 0.2rem 0 0;"><a href={resolve('/profile/[user=actor]', { user: params.user })}>@{data.profile.handle}</a></p>
    </div>
  </div>

  <p class="muted" style="margin: 0 0 0.35rem;">{formatDate(data.userstyle.createdAt)}</p>

  <pre>
    <code>{data.userstyle.sourceCode}</code>
  </pre>

  {#if user.isLoggedIn && user.did == data.profile.did}
    <button
      type="button"
      class="btn"
      onclick={() => removeUserstyle()}
      disabled={deleting}
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
    {#if error}<section class="panel" style="color: #b00020;">{error}</section>{/if}
  {:else}
    <!-- TODO: Add liking functionality for other non-author users. -->
  {/if}
</section>

<section class="panel" style="display: grid; gap: 0.75rem;">
  <a href={resolve('/install/[user=actor]/[style=rkey].user.css', { user: params.user, style: params.style })} class="btn">Install</a>
</section>
