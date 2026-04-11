<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import '../app.css';
  import { initClient, user } from '$lib/at';

  let { children } = $props();

  onMount(async () => {
    await initClient();
  });
</script>

<svelte:head>
  <title>Svelte ATProto Static Template</title>
  <meta name="description" content="Minimal SvelteKit + ATProto starter for static hosting" />
  <link rel="icon" href="{base}/favicon.svg" />
</svelte:head>

{#if user.isInitializing}
  <main style="min-height: 100vh; display: grid; place-items: center;">
    <div class="panel" style="padding: 1rem 1.2rem;">Initializing ATProto client...</div>
  </main>
{:else}
  {@render children()}
{/if}
