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

<div class="row">
  <section class="card col-6 offset-3">
    <h1 style="margin: 0 0 0.3rem;">Sign in with ATProto</h1>
    <p class="text-light">Enter `alice.bsky.social` or a DID.</p>

    <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
      <input type="text" bind:value={handle} placeholder="alice.bsky.social" />
      {#if error}
        <div role="alert" data-variant="error">
          <strong>Error!</strong> {error}
        </div>
      {/if}
      <button type="submit" disabled={loading || !handle.trim()}>
        {loading ? 'Opening OAuth...' : 'Continue'}
      </button>
      <button type="button" class="outline" onclick={signup}>Create account</button>
    </form>

    <p style="margin: 1rem 0 0;">
      <a href="{base}/" class="text-light">Back home</a>
    </p>
  </section>
</div>
