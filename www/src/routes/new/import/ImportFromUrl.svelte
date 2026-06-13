<script lang="ts">
  import type { UserstyleContent } from '$lib/at';
  import type { UserstyleFormState } from '../fields.svelte';

  import { Spinner, Alert } from '$components/ui';

  import { type ImportResult } from '.';
  import { getUsercssMetadata } from './metadata';
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

      if (result.sourceCode) {
        const usercss = getUsercssMetadata(result.sourceCode);
        for (const key of Object.keys(usercss) as Array<keyof UserstyleContent>) {
          if (result[key] === undefined && usercss[key] !== undefined) (result as any)[key] = usercss[key];
        }
      }

      // Merge into form fields only where the field is currently empty.
      for (const key of Object.keys(result) as Array<keyof UserstyleContent>) {
        const value = result[key];
        if (value && !fields[key]?.trim()) (fields as any)[key] = value;
      }

      fields.upstreamUrl = importUrl;
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
    <span class="field-label">Import from URL</span>
    <div class="text-input-button-group">
      <input
        type="url"
        bind:value={importUrl}
        placeholder="https://tangled.org/example.org/my-userstyle/raw/main/style.user.css"
        aria-describedby="import-from-url-desc"
      />
      <button type="submit" disabled={pending || !importUrl.trim()}>
        {#if pending}<Spinner size="sm" /> Importing…{:else}Import{/if}
      </button>
    </div>
  </label>
  <p class="form-hint" id="import-from-url-desc">
    Import from GitHub, Tangled, Userstyles.world, USo Archive, or any other CSS file on the internet.
  </p>
</form>

{#if warning}
  <Alert variant="warning">{warning}</Alert>
{/if}
{#if error}
  <Alert variant="error">{error}</Alert>
{/if}
