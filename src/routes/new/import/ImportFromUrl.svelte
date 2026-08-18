<script lang="ts">
  import type { GenericUri } from '@atcute/lexicons';
  import type { UserstyleFormState } from '../fields.svelte';

  import { Loading, Alert } from '$components/ui';

  import { applyImportResult, type ImportResult } from '.';
  import { importFromProviders } from './providers';

  interface Props {
    fields: UserstyleFormState;
    pending: boolean;
    imported?: ImportResult | null;
  }

  let { fields, pending = $bindable(), imported = $bindable(null) }: Props = $props();

  let importUrl = $state('');

  let warning = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function importFromUrl(event: Event) {
    event.preventDefault();
    if (pending) return;

    error = null;
    warning = null;
    pending = true;

    try {
      const result = await importFromProviders(importUrl);

      applyImportResult(fields, result);

      fields.upstreamUrl = importUrl as GenericUri;
      fields.trackUpstreamUrl = true;

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
    <span class="form-field-label">Import from URL</span>
    <div class="form-input-group">
      <input
        class="form-input-group__input"
        type="url"
        bind:value={importUrl}
        placeholder="https://tangled.org/example.org/my-userstyle/raw/main/style.user.css"
        aria-describedby="import-from-url-desc"
      />
      <button class="form-input-group__btn" type="submit" disabled={pending || !importUrl.trim()}>
        <Loading {pending} idle="Import" active="Importing…" />
      </button>
    </div>
  </label>
  <p class="form-hint" id="import-from-url-desc">
    Import from GitHub, Tangled, Userstyles.world, USo Archive, or just any CSS file on the
    internet.
  </p>
</form>

{#if warning}
  <Alert variant="warning">{warning}</Alert>
{/if}
{#if error}
  <Alert variant="error">{error}</Alert>
{/if}
