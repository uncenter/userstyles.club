<script lang="ts">
  import { goto } from '$app/navigation';
  import { createUserstyle, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import CodeMirror from "svelte-codemirror-editor";
  import { css } from "@codemirror/lang-css";
  import { hyperlink } from "$lib/codemirror/hyperlink";

  import { PersistedState } from 'runed';

  import { fetchRawFile } from './github.remote';
  import usercss from "usercss-meta";

  const fields = new PersistedState("new-userstyle-fields", { title: "", description: "", sourceCode: "", importUrl: "" }, {
    storage: "session",
    syncTabs: false,
  });

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
      let userstyle = await createUserstyle(fields.current.title, fields.current.sourceCode);
      let uri = parseResourceUri(userstyle.uri);
      fields.disconnect();
      goto(`/style/${uri.repo}/${uri.rkey}`);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      saving = false;
    }
  }

  async function importFromUrl(event: Event) {
    event.preventDefault();
    if (saving) return;

    error = null;
    let url = fields.current.importUrl;

    try {
      // TODO: Normalize GitHub file URLs into raw URLs.
      // const pattern = new URLPattern("/:user/:repository/:type(blob|raw)/*", "https://github.com");
      // const result = pattern.exec(url);
      // if (result) {
      //   if (result.pathname.groups.type == "blob")  {
      //     url = result
      //   }
      // }
      let userstyle = await fetchRawFile(url).run();
      if (!userstyle) throw new Error("Unable to import from URL");
      let meta = usercss.parse(userstyle);
      console.log({meta, userstyle})
      if (!fields.current.title.trim() && meta.metadata.name) fields.current.title = meta.metadata.name as string;
      if (!fields.current.description.trim() && meta.metadata.description) fields.current.description = meta.metadata.description as string;
      if (!fields.current.sourceCode.trim()) fields.current.sourceCode = userstyle;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to import userstyle from URL.';
    } finally {
      saving = false;
    }
  }
</script>

<header class="panel">
  <h1 class="section-title">New Userstyle</h1>
</header>

<section class="panel">
  <form onsubmit={importFromUrl} style="display: grid; gap: 0.75rem;">
    <label for="userstyle-import-url">Import from URL</label>
    <input type="text" id="userstyle-import-url" bind:value={() => fields.current.importUrl, (val) => fields.current.importUrl = val} maxlength="140" class="field" placeholder="https://github.com/user/repo/blob/main/style.user.css" />
    <button type="submit" class="btn primary" disabled={saving || !fields.current.importUrl.trim()}>
      Import
    </button>
  </form>
  <hr />
  <form onsubmit={submit} style="display: grid; gap: 0.75rem;">
    <label for="userstyle-title">Title</label>
    <input type="text" id="userstyle-title" bind:value={() => fields.current.title, (val) => fields.current.title = val} maxlength="140" class="field" placeholder="e.g. Tangled.org tweaks" />

    <label for="userstyle-desc">Description</label>
    <input type="text" id="userstyle-desc" bind:value={() => fields.current.description, (val) => fields.current.description = val} maxlength="140" class="field" />

    <CodeMirror bind:value={() => fields.current.sourceCode, (val) => fields.current.sourceCode = val} extensions={[hyperlink]} lang={css()} />
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
      <button type="submit" class="btn primary" disabled={saving || !fields.current.title.trim() || !fields.current.sourceCode.trim()}>
        {saving ? 'Publishing...' : 'Publish'}
      </button>
    </div>
  </form>
  {#if error}
    <p style="margin: 0.75rem 0 0; color: #b00020;">{error}</p>
  {/if}
</section>

<style>
  :global .codemirror-wrapper {
    /* https://discuss.codemirror.net/t/codemirror-6-setting-a-minimum-height-but-allow-the-editor-to-grow/2520/6 */
    display: flex;

    .cm-editor {
      width: 0;
      flex-grow: 1;

      .cm-content, .cm-gutter { min-height: 150px; }
      .cm-gutters { margin: 1px; }
      .cm-scroller { overflow: auto; }
      .cm-wrap { border: 1px solid silver }
    }
  }
</style>
