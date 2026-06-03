<script lang="ts">
  import { onMount } from 'svelte';
  import { base, resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import '../app.css';
  import '@knadh/oat/oat.min.css';
  import '@knadh/oat/oat.min.js';

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
    <div>Initializing ATProto client...</div>
  </main>
{:else}
  <header>
  </header>

  <nav class="row">
    <div class="col-4">
      <h1><a href={resolve('/')}>userstyles.club</a></h1>
    </div>
    <div class="col-8 justify-end hstack">
      <a href={resolve('/')}>Home</a>
      <a href={resolve('/explore')}>Explore</a>
      <a href={resolve('/new')}>New</a>
      {#if user.isLoggedIn && user.did}
        <a href={resolve('/profile/[user=actor]', { user: user.did })}>Profile</a>
        <a href={resolve('/settings')}>Settings</a>
        <button type="button" onclick={logout}>Logout</button>
      {:else}
        <a href={resolve('/login')}>Login</a>
      {/if}
    </div>
  </nav>
  <main class="container">
    {@render children()}
  </main>
{/if}
