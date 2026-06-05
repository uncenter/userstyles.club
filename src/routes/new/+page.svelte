<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createUserstyle, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import { joinPageTitle } from '$lib/constants';

  import CodeMirror from 'svelte-codemirror-editor';
  import { css } from '@codemirror/lang-css';
  import { hyperlink } from '$lib/codemirror/hyperlink';

  import { Spinner, Alert, Logo } from '$components';
  import ImportFromUrl from './ImportFromUrl.svelte';

  import { fields } from './fields.svelte';

  let publishing = $state(false);
  let importing = $state(false);
  let pending = $derived(publishing || importing);
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

    publishing = true;
    error = null;

    try {
      let sourceCode = fields.current.sourceCode;
      if (fields.current.removeUpdateUrl) {
        sourceCode = sourceCode
          .split('\n')
          .filter((line) => !/^\s*@updateURL\s/.test(line))
          .join('\n');
      }
      let userstyle = await createUserstyle(fields.current.title, sourceCode);
      let uri = parseResourceUri(userstyle.uri);
      fields.disconnect();
      goto(`/style/${uri.repo}/${uri.rkey}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      publishing = false;
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
    <ImportFromUrl {fields} bind:pending={importing} />

    <hr />

    <form onsubmit={submit} class="form-stack">
      <label class="form-group">
        Title
        <input
          type="text"
          bind:value={() => fields.current.title, (val) => (fields.current.title = val)}
          maxlength="140"
          placeholder="e.g. Tangled.org tweaks"
        />
      </label>

      <label class="form-group">
        Description
        <input
          type="text"
          bind:value={() => fields.current.description, (val) => (fields.current.description = val)}
          maxlength="140"
        />
      </label>

      <div class="form-group">
        <p class="editor-label">CSS</p>
        <CodeMirror
          bind:value={() => fields.current.sourceCode, (val) => (fields.current.sourceCode = val)}
          extensions={[hyperlink]}
          lang={css()}
        />
      </div>

      <div class="form-group">
        <label class="form-check">
          <input
            type="checkbox"
            bind:checked={
              () => fields.current.removeUpdateUrl, (val) => (fields.current.removeUpdateUrl = val)
            }
          />
          Check for updates from <Logo height="1rem" /> instead of original update URL?
        </label>
        <p class="form-hint">
          If there is a configured update URL within the userstyle source code, Stylus will check
          for updates from that URL instead of <strong>userstyles.club</strong>. Removes the
          <code>@updateURL</code> field from the userstyle's metadata.
        </p>
      </div>

      <div class="form-footer">
        <button
          type="submit"
          class="btn btn-primary"
          disabled={pending || !fields.current.title.trim() || !fields.current.sourceCode.trim()}
        >
          {#if publishing}<Spinner size="sm" /> Publishing…{:else}Publish{/if}
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
