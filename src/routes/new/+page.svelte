<script lang="ts">
  import { goto } from '$app/navigation';
  import { createUserstyle, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  // TODO: Save form values locally in case of accidental reload / etc.
  let title = $state('');
  let sourceCode = $state('');

  let saving = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto('/login');
      return;
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (saving) return;

    saving = true;
    error = null;

    try {
      let userstyle = await createUserstyle(title, sourceCode);
      let uri = parseResourceUri(userstyle.uri);
      title = '';
      sourceCode = '';
      goto(`/style/${uri.repo}/${uri.rkey}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      saving = false;
    }
  }
</script>

<header class="panel">
  <h1 class="section-title">New Userstyle</h1>
</header>

<section class="panel">
  <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
    <label for="userstyle-title">Title</label>
    <input type="text" id="userstyle-title" bind:value={title} maxlength="140" class="field" placeholder="My wonderful theme for..." />
    <textarea
      id="userstyle-source"
      bind:value={sourceCode}
      rows="10"
      class="field"
    ></textarea>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
      <button type="submit" class="btn primary" disabled={saving || !title.trim() || !sourceCode.trim()}>
        {saving ? 'Publishing...' : 'Publish'}
      </button>
    </div>
  </form>
  {#if error}
    <p style="margin: 0.75rem 0 0; color: #b00020;">{error}</p>
  {/if}
</section>
