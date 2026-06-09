<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createUserstyle, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import { joinPageTitle } from '$lib/constants';

  import CodeMirror from 'svelte-codemirror-editor';
  import { css } from '@codemirror/lang-css';
  import { hyperlink } from '$lib/codemirror/hyperlink';

  import { Spinner, Alert, Logo, PreviewImageUpload, BlueskyIcon, Dialog } from '$components';
  import ImportFromUrl from './ImportFromUrl.svelte';

  import { fields } from './fields.svelte';

  let publishing = $state(false);
  let importing = $state(false);
  let pending = $derived(publishing || importing);
  let error = $state<string | null>(null);

  let previewImage = $state<File | null>(null);

  let shareDialogOpen = $state(false);
  let publishedUrl = $state('');
  let shareText = $state('');

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
      let userstyle = await createUserstyle(
        fields.current.title,
        fields.current.description,
        sourceCode,
        previewImage ?? undefined
      );
      let uri = parseResourceUri(userstyle.uri);
      fields.disconnect();
      publishedUrl = `/style/${uri.repo}/${uri.rkey}`;
      shareText = `Just published "${fields.current.title}" on userstyles.club!\n\nhttps://userstyles.club${publishedUrl}`;
      shareDialogOpen = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      publishing = false;
    }
  }

  function skipShare() {
    shareDialogOpen = false;
    goto(publishedUrl);
  }

  function openInBluesky() {
    window.open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
    shareDialogOpen = false;
    goto(publishedUrl);
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
        <span class="field-label">Title</span>
        <input
          type="text"
          required
          bind:value={() => fields.current.title, (val) => (fields.current.title = val)}
          maxlength="140"
          placeholder="e.g. Tangled.org tweaks"
        />
      </label>

      <label class="form-group">
        <span class="field-label">Description</span>
        <input
          type="text"
          bind:value={() => fields.current.description, (val) => (fields.current.description = val)}
          maxlength="300"
        />
      </label>

      <PreviewImageUpload bind:file={previewImage} />

      <div class="form-group">
        <p class="field-label" data-required>CSS</p>
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
            aria-describedby="remove-update-url-desc"
          />
          Check for updates from <Logo height="1rem" /> instead of original update URL?
        </label>
        <p class="form-hint" id="remove-update-url-desc">
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

<Dialog bind:open={shareDialogOpen} title="Share to Bluesky?" maxWidth="32rem">
  {#snippet children()}
    <p class="text-muted">Congratulations on publishing! Let your friends know about your new userstyle.</p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={skipShare}>Maybe later</button>
    <button class="btn btn-bsky" type="button" onclick={openInBluesky}>
      <BlueskyIcon size={16} /> Open in Bluesky
    </button>
  {/snippet}
</Dialog>

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
