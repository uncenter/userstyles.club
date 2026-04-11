<script lang="ts">
  import { base } from '$app/paths';
  import { user, logout } from '$lib/at';
</script>

<main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  <header class="panel">
    <p class="muted" style="margin: 0;">Template</p>
    <h1 style="margin: 0.35rem 0 0;">Svelte + ATProto Static Starter</h1>
  </header>

  <section class="panel">
    <nav class="actions">
      <a href="{base}/search" class="btn">Search</a>
      <a href="{base}/post" class="btn">Post</a>
      <a href="{base}/notes" class="btn">Notes</a>
      {#if user.isLoggedIn}
        <a href="{base}/repo" class="btn">Repo</a>
      {/if}
      {#if user.isLoggedIn && user.did}
        <a href="{base}/profile/{user.did}" class="btn">My profile</a>
        <button type="button" class="btn" onclick={logout}>Logout</button>
      {:else}
        <a href="{base}/login" class="btn primary">Login</a>
      {/if}
    </nav>
  </section>

  <section class="panel">
    {#if user.isLoggedIn && user.did}
      <h2 style="margin: 0 0 0.35rem;">Signed in as <strong>@{user.profile?.handle ?? user.did}</strong></h2>
      <p style="margin: 0 0 0.35rem;">Explore features:</p>
      <ul class="plain" style="line-height: 1.6;">
        <li><strong>Search</strong>: find accounts and open profile pages.</li>
        <li><strong>Post</strong>: publish a basic <code>app.bsky.feed.post</code> record.</li>
        <li><strong>Notes</strong>: create and delete records in the sample custom collection.</li>
        <li><strong>Repo</strong>: inspect your collections and open records in <code>pdsls.dev</code>.</li>
        <li><strong>My profile</strong>: view your profile and test follow/unfollow flow on others.</li>
        <li><strong>Logout</strong>: clear current OAuth session from this app.</li>
      </ul>
    {:else}
      <p style="margin: 0 0 0.35rem;">This starter includes boilerplate for:</p>
      <ul class="muted plain" style="line-height: 1.6;">
        <li>ATProto OAuth login in browser</li>
        <li>User search (typeahead)</li>
        <li>Profile view from public API</li>
        <li>Follow / unfollow via repo records</li>
        <li>Bluesky post creation via <code>app.bsky.feed.post</code></li>
        <li>Custom collection CRUD via <code>com.example.app.note</code></li>
        <li>Repo explorer with <code>pdsls.dev</code> links</li>
      </ul>
    {/if}
  </section>

  <section class="panel">
    <h2 style="margin: 0 0 0.45rem;">Why this starter kit</h2>
    <p style="margin: 0 0 0.45rem;">
      This is a static SvelteKit starter for AT Protocol apps with no backend required.
      You can clone it, change a few files, and ship a working app on GitHub Pages.
    </p>
    <ul class="plain" style="line-height: 1.6;">
      <li>Real ATProto flows included: OAuth login, profile lookup, follows, posting, and repo exploration.</li>
      <li>Reusable service modules for auth-aware writes, public reads, repo access, and collection-driven apps.</li>
      <li>Easy to extend with your own lexicons and collections as your app grows.</li>
      <li>Designed for prototypes, unusual social UX, and production-ready static frontends.</li>
    </ul>
  </section>

  <section class="panel">
    <h2 style="margin: 0 0 0.45rem;">How to build something unique</h2>
    <ul class="plain" style="line-height: 1.6;">
      <li>Keep routes thin and move protocol logic into reusable services.</li>
      <li>Use ATProto records as your app data model instead of copying Bluesky UI patterns.</li>
      <li>Add custom lexicons under <code>lexicons/</code> and CRUD flows via <code>src/lib/at/records.ts</code>.</li>
      <li>Treat the bundled pages as examples you can remix, replace, or ignore.</li>
    </ul>
  </section>
</main>
