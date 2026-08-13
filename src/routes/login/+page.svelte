<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { login, signup, user } from '$lib/at';

  import { BackLink, Loading, Alert } from '$components/ui';
  import { Meta } from '$components';

  import { isActorIdentifier } from '@atcute/lexicons/syntax';

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
      await login(handle);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Login failed.';
      loading = false;
    }
  }
</script>

<Meta title="Login" description="Sign in to userstyles.club." />

<div class="centered-col">
  <section class="page-section login-card">
    <div class="login-card__header">
      <h1 class="login-card__title">Sign In</h1>
      <p class="text-muted">Enter your Bluesky (Atmosphere) handle or DID to continue.</p>
    </div>

    <form onsubmit={submit} class="form-stack">
      <div class="form-group">
        <label for="handle-input">Handle or DID</label>
        <input
          id="handle-input"
          type="text"
          bind:value={handle}
          placeholder="alice.bsky.social"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
        />
      </div>
      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}
      <button
        type="submit"
        class="btn btn--primary"
        disabled={loading || !isActorIdentifier(handle)}
      >
        <Loading pending={loading} idle="Continue" active="Signing in…" />
      </button>
      <button type="button" class="link" onclick={signup}>
        Don't have a Bluesky (Atmosphere) account?
      </button>
    </form>

    <BackLink href={resolve('/')} label="Back to Home" />
  </section>
</div>

<style>
  .login-card {
    .login-card__title {
      font-size: var(--text-2xl);
    }

    .login-card__header {
      display: grid;
      gap: var(--space-1);
      margin-bottom: var(--space-5);
    }
  }
</style>
