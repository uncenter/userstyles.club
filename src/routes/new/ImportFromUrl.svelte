<script lang="ts">
  import type { NewUserstyleFields } from './fields.svelte';
  import { fetchFromUserstylesWorld, fetchRawFile, type StyleImport } from './fetch.remote';
  import usercss from 'usercss-meta';

  import { Spinner, Alert } from '$components';

  interface Props {
    fields: NewUserstyleFields;
    pending: boolean;
  }

  let { fields, pending = $bindable() }: Props = $props();

  let warning = $state<string | null>(null);
  let error = $state<string | null>(null);

  const usercssParser = usercss.createParser({ mandatoryKeys: ['title', 'description'], allowErrors: true });
  const USW_PATTERN = new URLPattern('/style/:id(\\d+){/:name}?{/}?', 'https://userstyles.world');

  function normalizeGitHubUrl(input: string): string {
    const pattern = new URLPattern('/:user/:repo/blob/:rest*', 'https://github.com');
    const match = pattern.exec(input);
    if (match) {
      const { user, repo, rest } = match.pathname.groups;
      return `https://github.com/${user}/${repo}/raw/${rest}`;
    }
    return input;
  }

  async function fetchFromUrl(url: string): Promise<StyleImport> {
    const normalized = normalizeGitHubUrl(url);
    const fetched = await fetchRawFile(normalized).run();
    if (!fetched) throw new Error('Unable to import from URL');

    let parsed = usercssParser.parse(fetched);
    for (let err of parsed.errors) {
      if (err.code === 'missingMandatory') {
        warning = err.message;
      } else {
        error = err.message;
      }
    }

    return {
      name: parsed.metadata.name as string | undefined,
      desc: parsed.metadata.description as string | undefined,
      sourceCode: fetched,
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
        ? await fetchFromUserstylesWorld(uswMatch.pathname.groups.id!).run()
        : await fetchFromUrl(url);

      if (!fields.current.sourceCode.trim()) fields.current.sourceCode = result.sourceCode;
      if (!fields.current.title.trim() && result.name) fields.current.title = result.name;
      if (!fields.current.description.trim() && result.desc) fields.current.description = result.desc;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to import userstyle from URL.';
    } finally {
      pending = false;
    }
  }
</script>

<form onsubmit={importFromUrl} class="form-stack">
  <div class="form-group">
    <label>
      Import from URL
      <input
        type="text"
        bind:value={() => fields.current.importUrl, (val) => (fields.current.importUrl = val)}
        placeholder="https://tangled.org/example.org/my-userstyle/raw/main/style.user.css"
        aria-describedby="import-from-url-desc"
      />
    </label>
    <p class="form-hint" id="import-from-url-desc">
      Import from Userstyles.world, Tangled, GitHub, or from any other raw CSS file on the internet.
    </p>
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
