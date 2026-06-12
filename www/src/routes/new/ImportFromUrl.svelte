<script lang="ts">
  import type { NewUserstyleFields } from './fields.svelte';
  import { fetchFromUserstylesWorld, fetchRawFile, type StyleImport } from './fetch.remote';
  import usercss from 'usercss-meta';

  import { Spinner, Alert } from '$components/ui';

  interface Props {
    fields: NewUserstyleFields;
    pending: boolean;
    imported?: StyleImport | null;
  }

  let { fields, pending = $bindable(), imported = $bindable(null) }: Props = $props();

  let warning = $state<string | null>(null);
  let error = $state<string | null>(null);

  const usercssParser = usercss.createParser({
    mandatoryKeys: [],
    allowErrors: true
  });
  const USW_PATTERN = new URLPattern('/style/:id(\\d+){/:name}?{/}?', 'https://userstyles.world');

  function normalizeForgeUrl(input: string): string {
    const hosts = ['github.com', 'tangled.org'];

    for (const host of hosts) {
      const pattern = new URLPattern('/:user/:repo/blob/:rest*', `https://${host}`);

      const match = pattern.exec(input);

      if (match) {
        const { user, repo, rest } = match.pathname.groups;
        return `https://${host}/${user}/${repo}/raw/${rest}`;
      }
    }

    return input;
  }

  async function fetchFromUrl(url: string): Promise<StyleImport> {
    const normalized = normalizeForgeUrl(url);
    const fetched = await fetchRawFile(normalized);
    if (!fetched) throw new Error('Unable to import from URL');

    let parsed = usercssParser.parse(fetched);
    for (let err of parsed.errors) {
      error = err.message;
    }

    return {
      title: parsed.metadata.name as string | undefined,
      description: parsed.metadata.description as string | undefined,
      license: parsed.metadata.license as string | undefined,
      code: fetched
    };
  }

  async function importFromUrl(event: Event) {
    event.preventDefault();
    if (pending) return;

    error = null;
    warning = null;
    pending = true;

    try {
      const url = fields.current.importUrl;
      const uswMatch = USW_PATTERN.exec(url);
      const result = uswMatch
        ? await fetchFromUserstylesWorld(uswMatch.pathname.groups.id!)
        : await fetchFromUrl(url);

      if (!fields.current.sourceCode.trim()) fields.current.sourceCode = result.code ?? '';
      if (!fields.current.title.trim() && result.title) fields.current.title = result.title;
      if (!fields.current.description.trim() && result.description)
        fields.current.description = result.description;
      if (!fields.current.license.trim() && result.license) fields.current.license = result.license;

      imported = result;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to import userstyle from URL.';
    } finally {
      pending = false;
    }
  }
</script>

<form onsubmit={importFromUrl} class="form-group">
  <label>
    <span class="field-label">Import from URL</span>
    <div class="text-input-button-group">
      <input
        type="text"
        bind:value={() => fields.current.importUrl, (val) => (fields.current.importUrl = val)}
        placeholder="https://tangled.org/example.org/my-userstyle/raw/main/style.user.css"
        aria-describedby="import-from-url-desc"
      />
      <button type="submit" disabled={pending || !fields.current.importUrl.trim()}>
        {#if pending}<Spinner size="sm" /> Importing…{:else}Import{/if}
      </button>
    </div>
  </label>
  <p class="form-hint" id="import-from-url-desc">
    Import from Userstyles.world, Tangled, GitHub, or from any other raw CSS file on the internet.
  </p>
</form>

{#if warning}
  <Alert variant="warning">{warning}</Alert>
{/if}
{#if error}
  <Alert variant="error">{error}</Alert>
{/if}
