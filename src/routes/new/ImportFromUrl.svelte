<script lang="ts">
  import type { NewUserstyleFields } from './fields.svelte';
  import { fetchRawFile } from './github.remote';
  import usercss from 'usercss-meta';

  import { Spinner, Alert } from '$components';

  interface Props {
    fields: NewUserstyleFields;
    pending: boolean;
  }

  let { fields, pending = $bindable() }: Props = $props();

  let warning = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function importFromUrl(event: Event) {
    event.preventDefault();
    if (pending) return;

    error = null;
    warning = null;
    pending = true;
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
      if (!userstyle) throw new Error('Unable to import from URL');
      if (!fields.current.sourceCode.trim()) fields.current.sourceCode = userstyle;
      let meta = usercss.createParser({ mandatoryKeys: ['title', 'description'] }).parse(userstyle);
      if (!fields.current.title.trim() && meta.metadata.name)
        fields.current.title = meta.metadata.name as string;
      if (!fields.current.description.trim() && meta.metadata.description)
        fields.current.description = meta.metadata.description as string;
    } catch (e) {
      if (e instanceof usercss.ParseError && e.code === 'missingMandatory') {
        warning = e.message;
      } else {
        error = e instanceof Error ? e.message : 'Failed to import userstyle from URL.';
      }
    } finally {
      pending = false;
    }
  }
</script>

<form onsubmit={importFromUrl} class="form-stack">
  <div class="form-group">
    <label for="userstyle-import-url">Import from URL</label>
    <input
      type="text"
      id="userstyle-import-url"
      bind:value={() => fields.current.importUrl, (val) => (fields.current.importUrl = val)}
      placeholder="https://github.com/user/repo/raw/main/style.user.css"
    />
  </div>
  <div>
    <button
      type="submit"
      class="btn btn-secondary"
      disabled={pending || !fields.current.importUrl.trim()}
    >
      {#if pending}<Spinner size="sm" /> Importing…{:else}Import{/if}
    </button>
  </div>

  {#if warning}
    <Alert variant="warning">{warning}</Alert>
  {/if}
  {#if error}
    <Alert variant="error">{error}</Alert>
  {/if}
</form>
