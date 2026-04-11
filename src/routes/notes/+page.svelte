<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { createNote, deleteNote, type ExampleNoteRecord, user, EXAMPLE_NOTE_COLLECTION, listMyNotes } from '$lib/at';

  let text = $state('');
  let notes = $state<ExampleNoteRecord[]>([]);
  let loading = $state(false);
  let saving = $state(false);
  let deletingUri = $state<string | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto('/login');
      return;
    }

    loadNotes();
  });

  async function loadNotes() {
    loading = true;
    error = null;

    try {
      notes = await listMyNotes();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load notes.';
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
      await createNote(text);
      text = '';
      await loadNotes();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create note.';
    } finally {
      saving = false;
    }
  }

  async function removeNote(uri: string) {
    if (deletingUri) return;

    deletingUri = uri;
    error = null;

    try {
      await deleteNote(uri);
      notes = notes.filter((note) => note.uri !== uri);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete note.';
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
    <h1 class="section-title">Example notes collection</h1>
  </header>

  <section class="panel">
    <div class="actions">
      <a href="{base}/" class="btn">Home</a>
      <button type="button" class="btn" onclick={loadNotes} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </section>

  <section class="panel">
    <p class="muted" style="margin: 0 0 0.45rem;">Custom collection: <code>{EXAMPLE_NOTE_COLLECTION}</code></p>
    <p style="margin: 0;">
      This route demonstrates the core ATProto app pattern: a custom collection backed by browser OAuth and repo writes.
    </p>
  </section>

  <section class="panel">
    <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
      <label for="note-text">Create a note</label>
      <textarea
        id="note-text"
        bind:value={text}
        maxlength="300"
        rows="4"
        class="field"
        placeholder="Capture an idea for your ATProto app."
      ></textarea>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <span class="muted" style="font-size: 0.9rem;">{text.length}/300</span>
        <button type="submit" class="btn primary" disabled={saving || !text.trim()}>
          {saving ? 'Saving...' : 'Save note'}
        </button>
      </div>
    </form>
    {#if error}
      <p style="margin: 0.75rem 0 0; color: #b00020;">{error}</p>
    {/if}
  </section>

  <section class="panel" style="display: grid; gap: 0.75rem;">
    <h2 style="margin: 0; font-size: 1rem;">Your notes</h2>

    {#if loading}
      <p style="margin: 0;">Loading notes...</p>
    {:else if notes.length === 0}
      <p class="muted" style="margin: 0;">No notes yet. Create your first custom record above.</p>
    {:else}
      <ul class="plain">
        {#each notes as note}
          <li style="margin-bottom: 0.9rem;">
            <p style="margin: 0 0 0.25rem; line-height: 1.5;">{note.value.text}</p>
            <p class="muted" style="margin: 0 0 0.35rem;">{formatDate(note.value.createdAt)}</p>
            <p style="margin: 0 0 0.35rem; overflow-wrap: anywhere;"><code>{note.uri}</code></p>
            <button
              type="button"
              class="btn"
              onclick={() => removeNote(note.uri)}
              disabled={deletingUri === note.uri}
            >
              {deletingUri === note.uri ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
