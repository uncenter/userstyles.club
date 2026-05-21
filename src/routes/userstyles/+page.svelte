<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { createUserstyle, deleteUserstyle, type UserstyleRecord, user, USERSTYLE_COLLECTION, listMyUserstyles } from '$lib/at';

  let title = $state('');
  let sourceCode = $state('');

  let userstyles = $state<UserstyleRecord[]>([]);
  
  let loading = $state(false);
  let saving = $state(false);
  let deletingUri = $state<string | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto('/login');
      return;
    }

    loadUserstyles();
  });

  async function loadUserstyles() {
    loading = true;
    error = null;

    try {
      userstyles = await listMyUserstyles();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load userstyles.';
    } finally {
      loading = false;
    }
  }

  async function submit(event: Event) {
    event.preventDefault();
    if (saving) return;

    saving = true;
    error = null;

    try {
      await createUserstyle(title, sourceCode);
      title = '';
      sourceCode = '';
      await loadUserstyles();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      saving = false;
    }
  }

  async function removeUserstyle(uri: string) {
    if (deletingUri) return;

    deletingUri = uri;
    error = null;

    try {
      await deleteUserstyle(uri);
      userstyles = userstyles.filter((note) => note.uri !== uri);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete userstyle.';
    } finally {
      deletingUri = null;
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }
</script>

<main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  <header class="panel">
    <h1 class="section-title">Userstyles</h1>
  </header>

  <section class="panel">
    <div class="actions">
      <a href="{base}/" class="btn">Home</a>
      <button type="button" class="btn" onclick={loadUserstyles} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </section>

  <section class="panel">
    <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
      <label for="userstyle-title">Create a userstyle</label>
      <input type="text" id="userstyle-title" bind:value={title} maxlength="140" class="field" placeholder="Title your userstyle." />
      <textarea
        id="userstyle-sourceCode"
        bind:value={sourceCode}
        rows="10"
        class="field"
      ></textarea>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <button type="submit" class="btn primary" disabled={saving || !title.trim() || !sourceCode.trim()}>
          {saving ? 'Saving...' : 'Save userstyle'}
        </button>
      </div>
    </form>
    {#if error}
      <p style="margin: 0.75rem 0 0; color: #b00020;">{error}</p>
    {/if}
  </section>

  <section class="panel" style="display: grid; gap: 0.75rem;">
    <h2 style="margin: 0; font-size: 1rem;">Your userstyles</h2>

    {#if loading}
      <p style="margin: 0;">Loading userstyles...</p>
    {:else if userstyles.length === 0}
      <p class="muted" style="margin: 0;">No userstyles yet. Create your first userstyle above.</p>
    {:else}
      <ul class="plain">
        {#each userstyles as userstyle}
          <li style="margin-bottom: 0.9rem;">
            <p style="margin: 0 0 0.25rem; line-height: 1.5;">{userstyle.value.title}</p>
            <p class="muted" style="margin: 0 0 0.35rem;">{formatDate(userstyle.value.createdAt)}</p>
            <p style="margin: 0 0 0.35rem; overflow-wrap: anywhere;"><code>{userstyle.uri}</code></p>
            <button
              type="button"
              class="btn"
              onclick={() => removeUserstyle(userstyle.uri)}
              disabled={deletingUri === userstyle.uri}
            >
              {deletingUri === userstyle.uri ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
