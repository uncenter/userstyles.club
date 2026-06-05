<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  import { joinPageTitle } from '$lib/constants';

  import { updateUserstyle, user } from '$lib/at';

  import CodeMirror from 'svelte-codemirror-editor';
  import { css } from '@codemirror/lang-css';
  import { hyperlink } from '$lib/codemirror/hyperlink';

  import { Spinner, Alert } from '$components';

  let { data }: PageProps = $props();

  let title = $state(data.userstyle.title);
  let sourceCode = $state(data.userstyle.sourceCode);
  let saving = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto(resolve('/login'));
      return;
    }
    // Redirect non-owners back to the style page
    if (user.did && user.did !== data.profile.did) {
      goto(resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style }));
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (saving) return;

    saving = true;
    error = null;

    try {
      await updateUserstyle(data.style, title, sourceCode, data.userstyle.createdAt);
      goto(resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style }));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save userstyle.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{joinPageTitle('Editing', data.userstyle.title)}</title>
</svelte:head>

<div class="narrow-col">
  <div class="page-section">
    <h1>Edit Userstyle</h1>
  </div>

  <div class="page-section">
    <form onsubmit={submit} class="form-stack">
      <div class="form-group">
        <label for="userstyle-title">Title</label>
        <input
          type="text"
          id="userstyle-title"
          bind:value={title}
          maxlength="140"
          placeholder="e.g. Tangled.org tweaks"
        />
      </div>

      <div class="form-group">
        <p class="editor-label">CSS</p>
        <CodeMirror
          bind:value={() => sourceCode, (val) => (sourceCode = val)}
          extensions={[hyperlink]}
          lang={css()}
        />
      </div>

      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}

      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          disabled={saving || !title.trim() || !sourceCode.trim()}
        >
          {#if saving}<Spinner size="sm" /> Saving…{:else}Save{/if}
        </button>
        <a
          href={resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style })}
          class="btn btn-outline"
        >
          Cancel
        </a>
      </div>
    </form>
  </div>
</div>

<style>
  .editor-label {
    font-size: var(--text-sm);
    font-weight: 500;
    margin-bottom: var(--space-1);
  }

  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  :global .codemirror-wrapper {
    display: flex;
    border: 2px solid var(--input-border);
    overflow: hidden;
    transition:
      border-color var(--ease-fast),
      box-shadow var(--ease-fast);

    &:focus-within {
      border-color: var(--ring);
      box-shadow: 3px 3px 0 var(--accent);
    }

    .cm-editor {
      width: 0;
      flex-grow: 1;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      background: var(--bg-subtle) !important;
      color: var(--foreground) !important;

      .cm-content,
      .cm-gutter {
        min-height: 240px;
      }
      .cm-gutters {
        margin: 0;
        background: var(--bg-muted) !important;
        color: var(--fg-muted) !important;
        border-right: 2px solid var(--border) !important;
      }
      .cm-scroller {
        overflow: auto;
      }
      .cm-activeLine {
        background: color-mix(in srgb, var(--accent) 8%, transparent) !important;
      }
      .cm-activeLineGutter {
        background: color-mix(in srgb, var(--accent) 12%, transparent) !important;
      }
      .cm-cursor,
      .cm-dropCursor {
        border-left-color: var(--accent) !important;
      }
      .cm-selectionBackground {
        background: color-mix(in srgb, var(--accent) 25%, transparent) !important;
      }
      &.cm-focused .cm-selectionBackground {
        background: color-mix(in srgb, var(--accent) 30%, transparent) !important;
      }
    }
  }
</style>
