<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { joinPageTitle } from '$lib/constants';

  import { login, signup, user } from '$lib/at';
  import type { ActorIdentifier } from '@atcute/lexicons';

  import { Spinner, Alert } from '$components';

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
      error = e instanceof Error ? e.message : 'Login failed.';
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{joinPageTitle('Login')}</title>
</svelte:head>

<div class="centered-col">
  <section class="page-section login-card">
    <div class="login-header">
      <h1>Sign in</h1>
      <p class="text-muted">Enter your Bluesky handle or DID to continue.</p>
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
      <button type="submit" class="btn btn-primary" disabled={loading || !handle.trim()}>
        {#if loading}<Spinner size="sm" /> Opening OAuth…{:else}Continue{/if}
      </button>
      <button type="button" class="btn btn-outline" onclick={signup}> Create account </button>
    </form>

    <p class="login-back">
      <a href={resolve('/')} class="text-muted">← Back home</a>
    </p>
  </section>
</div>

<style>
  .login-card {
    h1 {
      font-size: var(--text-2xl);
    }

    .login-header {
      display: grid;
      gap: var(--space-1);
      margin-bottom: var(--space-5);
    }

    .login-back {
      margin-top: var(--space-5);
      font-size: var(--text-sm);

      a {
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>
