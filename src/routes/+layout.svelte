<script lang="ts">
  import { onMount } from 'svelte';
  import { base, resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import '../app.css';
  import { initClient, user, logout } from '$lib/at';
  import type { AppBskyActorDefs } from '@atcute/bluesky';
  import { ActorSearch } from '$components';

  function selectActor(actor: AppBskyActorDefs.ProfileViewBasic) {
    goto(`/profile/${actor.did}`);
  }

  let { children } = $props();

  onMount(async () => {
    await initClient();
  });
</script>

<svelte:head>
  <title>userstyles.club</title>
  <meta name="description" content="Decentralized userstyles publishing." />
  <link rel="icon" href="{base}/favicon.svg" />
</svelte:head>

{#if user.isInitializing}
  <main style="min-height: 100vh; display: grid; place-items: center;">
    <div class="panel" style="padding: 1rem 1.2rem;">Initializing ATProto client...</div>
  </main>
{:else}
  <header class="panel">
    <h1 style="margin: 0.35rem 0 0;">userstyles.club</h1>
  </header>

  <nav class="panel" style="display: flex; justify-content: space-between;">
    <div class="actions">
      <a href={resolve('/')} class="btn">Home</a>
      <a href={resolve('/explore')} class="btn">Explore</a>
      <a href={resolve('/new')} class="btn">New</a>
    </div>
    <div class="actions">
      <ActorSearch onSelect={selectActor} />
      {#if user.isLoggedIn && user.did}
        <a href={resolve('/profile/[actor]', { actor: user.did })} class="btn">Profile</a>
        <a href={resolve('/settings')} class="btn">Settings</a>
        <button type="button" class="btn" onclick={logout}>Logout</button>
      {:else}
        <a href={resolve('/login')} class="btn primary">Login</a>
      {/if}
    </div>
  </nav>
  <main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  {@render children()}
  </main>
{/if}
