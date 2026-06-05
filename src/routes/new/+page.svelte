<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createUserstyle, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import { joinPageTitle } from '$lib/constants';

  import CodeMirror from 'svelte-codemirror-editor';
  import { css } from '@codemirror/lang-css';
  import { hyperlink } from '$lib/codemirror/hyperlink';

  import Alert from '$components/ui/Alert.svelte';
  import Spinner from '$components/ui/Spinner.svelte';
  import ImportFromUrl from './ImportFromUrl.svelte';

  import { fields } from './fields.svelte';

  let pending = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto(resolve('/login'));
      return;
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (pending) return;

    pending = true;
    error = null;

    try {
      let userstyle = await createUserstyle(fields.current.title, fields.current.sourceCode);
      let uri = parseResourceUri(userstyle.uri);
      fields.disconnect();
      goto(`/style/${uri.repo}/${uri.rkey}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      pending = false;
    }
  }
</script>

<svelte:head>
	<title>{joinPageTitle('New Userstyle')}</title>
</svelte:head>

<div class="narrow-col">
  <div class="page-section">
    <h1>New Userstyle</h1>
  </div>

  <div class="page-section">
    <ImportFromUrl {fields} bind:pending={pending} />

    <hr />

    <form onsubmit={submit} class="form-stack">
      <div class="form-group">
        <label for="userstyle-title">Title</label>
        <input
          type="text"
          id="userstyle-title"
          bind:value={() => fields.current.title, (val) => (fields.current.title = val)}
          maxlength="140"
          placeholder="e.g. Tangled.org tweaks"
        />
      </div>

      <div class="form-group">
        <label for="userstyle-desc">Description</label>
        <input
          type="text"
          id="userstyle-desc"
          bind:value={() => fields.current.description, (val) => (fields.current.description = val)}
          maxlength="140"
        />
      </div>

      <div class="form-group">
        <p class="editor-label">CSS</p>
        <CodeMirror
          bind:value={() => fields.current.sourceCode, (val) => (fields.current.sourceCode = val)}
          extensions={[hyperlink]}
          lang={css()}
        />
      </div>

      <div>
        <button
          type="submit"
          class="btn btn-primary"
          disabled={pending || !fields.current.title.trim() || !fields.current.sourceCode.trim()}
        >
          {#if pending}<Spinner size="sm" /> Publishing…{:else}Publish{/if}
        </button>
      </div>

      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}
    </form>
  </div>
</div>

<style>
  .editor-label {
    font-size: var(--text-sm);
    font-weight: 500;
    margin-bottom: var(--space-1);
  }

  :global .codemirror-wrapper {
    /* https://discuss.codemirror.net/t/codemirror-6-setting-a-minimum-height-but-allow-the-editor-to-grow/2520/6 */
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
        min-height: 180px;
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
