<script lang="ts">
  import { page } from '$app/state';
  import { followActor, getFollowState, getProfile, unfollowActor, type UserstyleRecord, user, listUserstyles, getUserstyle, type Userstyle, deleteUserstyle } from '$lib/at';
  import type { AppBskyActorDefs } from '@atcute/bluesky';
  import type { ActorIdentifier } from '@atcute/lexicons';

  import UserstyleListing from '$components/UserstyleListing.svelte';
  import { base } from '$app/paths';

  let userstyle = $state<Userstyle | null>();

  let loading = $state(true);
  let error = $state<string | null>(null);

  const actor = $derived(page.params.actor);
  const rkey = $derived(page.params.rkey);

  $effect(() => {
    if (!actor || !rkey) return;
    load();
  });

  async function load() {
    loading = true;
    error = null;
    userstyle = null;

    try {
      // TODO: actor could be handle instead of did
      let record = await getUserstyle(actor!, rkey!);
      userstyle = record.value;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load userstyle.';
    } finally {
      loading = false;
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  async function delete() {
    error = null;

    try {
      await deleteUserstyle(uri);
      userstyles = userstyles.filter((note) => note.uri !== uri);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete userstyle.';
    } finally {
      deletingUri = null;
    }
  }
</script>

{#if loading}
  <section class="panel" style="padding: 1rem;">Loading userstyle...</section>
{:else if error}
  <section class="panel" style="color: #b00020;">{error}</section>
{:else if userstyle}
  <section class="panel" style="padding: 1rem; display: grid; gap: 1rem;">
    <div style="display: flex; gap: 0.9rem; align-items: center;">
      <div>
        <h1 style="margin: 0; font-size: 1.25rem;">{userstyle.title}</h1>
        <p class="muted" style="margin: 0.2rem 0 0;">by {actor}</p>
      </div>
    </div>

    <p class="muted" style="margin: 0 0 0.35rem;">{formatDate(userstyle.createdAt)}</p>

    <pre>
      <code>{userstyle.sourceCode}</code>
    </pre>

    <!-- TODO: Resolve actor to did first. -->
    {#if user.isLoggedIn && user.did == actor}
      <button
        type="button"
        class="btn"
        onclick={() => removeUserstyle(userstyle.uri)}
        disabled={deletingUri === userstyle.uri}
      >
        {deletingUri === userstyle.uri ? 'Deleting...' : 'Delete'}
      </button>
    {:else}
      <!-- TODO: Add liking functionality -->
    {/if}
  </section>

  <section class="panel" style="display: grid; gap: 0.75rem;">
    <a href="{base}/install/{actor}/{rkey}" class="btn">Install</a>
  </section>
{/if}
