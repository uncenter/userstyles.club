<script lang="ts">
  import { base } from '$app/paths';
  import { user, logout } from '$lib/at';
</script>

<main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  <header class="panel">
    <h1 style="margin: 0.35rem 0 0;">userstyles.club</h1>
  </header>

  <section class="panel">
    <nav class="actions">
      <a href="{base}/search" class="btn">Search</a>
      <a href="{base}/post" class="btn">Post</a>
      <a href="{base}/notes" class="btn">Notes</a>
      <a href="{base}/userstyles" class="btn">Userstyles</a>
      {#if user.isLoggedIn}
        <a href="{base}/repo" class="btn">Repo</a>
      {/if}
      {#if user.isLoggedIn && user.did}
        <a href="{base}/profile/{user.did}" class="btn">Profile</a>
        <button type="button" class="btn" onclick={logout}>Logout</button>
      {:else}
        <a href="{base}/login" class="btn primary">Login</a>
      {/if}
    </nav>
  </section>
</main>
