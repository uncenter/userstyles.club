<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import type { ActorIdentifier } from '@atcute/lexicons';
  import { login, signup, user } from '$lib/at';

  let handle = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);

  $effect(() => {
    if (user.isLoggedIn) {
      goto('/');
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (!handle.trim()) {
      error = 'Enter your handle or DID.';
      return;
    }

    loading = true;
    error = null;
    try {
      await login(handle as ActorIdentifier);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Login failed';
      loading = false;
    }
  }
</script>

<main class="shell" style="padding: 2rem 0 3rem;">
  <section class="panel" style="padding: 1.1rem; max-width: 520px; margin: 0 auto;">
    <h1 style="margin: 0 0 0.3rem;">Sign in with ATProto</h1>
    <p class="muted" style="margin: 0 0 1rem;">Enter `alice.bsky.social` or a DID.</p>

    <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
      <input type="text" bind:value={handle} placeholder="alice.bsky.social" />
      {#if error}
        <p style="margin: 0; color: #fca5a5;">{error}</p>
      {/if}
      <button type="submit" class="btn primary" disabled={loading}>
        {loading ? 'Opening OAuth...' : 'Continue'}
      </button>
      <button type="button" class="btn" onclick={signup}>Create account</button>
    </form>

    <p style="margin: 1rem 0 0;">
      <a href="{base}/" class="muted">Back home</a>
    </p>
  </section>
</main>
