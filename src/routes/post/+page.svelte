<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { createPost, user } from '$lib/at';

  let text = $state('');
  let isPosting = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto('/login');
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (isPosting) return;

    isPosting = true;
    error = null;
    success = null;

    try {
      const result = await createPost(text);
      text = '';
      success = `Posted: ${result.uri ?? 'record created'}`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to publish post';
    } finally {
      isPosting = false;
    }
  }
</script>

<main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  <header class="panel">
    <h1 class="section-title">Create Bluesky post</h1>
  </header>

  <section class="panel">
    <div class="actions">
      <a href="{base}/" class="btn">Home</a>
    </div>
  </section>

  <section class="panel">
    <p class="muted" style="margin-top: 0;">Collection: <code>app.bsky.feed.post</code></p>

    <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
      <label for="post-text">Text (max 300)</label>
      <textarea
        id="post-text"
        bind:value={text}
        maxlength="300"
        rows="5"
        class="field"
        placeholder="Hello from my SvelteKit ATProto app."
      ></textarea>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <span class="muted" style="font-size: 0.9rem;">{text.length}/300</span>
        <button type="submit" class="btn primary" disabled={isPosting || !text.trim()}>
          {isPosting ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </form>

    {#if error}
      <p style="margin: 0.75rem 0 0; color: #b00020;">{error}</p>
    {/if}
    {#if success}
      <p style="margin: 0.75rem 0 0;">{success}</p>
    {/if}
  </section>
</main>
