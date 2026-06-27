<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  import { updateUserstyle, type Userstyle } from '$lib/at';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { RefreshCwIcon, ExternalLinkIcon } from '@lucide/svelte';

  import { importFromProviders } from '../../../new/import/providers';
  import { getUsercssMetadata } from '../../../new/import/metadata';

  import bytes from 'pretty-bytes';

  interface Props {
    userstyle: Userstyle;
    rkey: string;
  }

  let { userstyle, rkey }: Props = $props();

  let syncing = $state(false);
  let saving = $state(false);
  let dialogOpen = $state(false);
  let error = $state<string | null>(null);
  let newSourceCode = $state<string | null>(null);

  let hasChanges = $derived(newSourceCode !== null && newSourceCode !== userstyle.sourceCode);

  let currentLines = $derived(userstyle.sourceCode.split('\n').length);
  let currentBytes = $derived(userstyle.sourceCode.length);
  let newLines = $derived(newSourceCode?.split('\n').length ?? 0);
  let newBytes = $derived(newSourceCode?.length ?? 0);

  let currentVersion = $derived(getUsercssMetadata(userstyle.sourceCode).version);
  let newVersion = $derived(newSourceCode ? getUsercssMetadata(newSourceCode).version : undefined);
  let isRegression = $derived(
    !!currentVersion && !!newVersion && compareVersions(newVersion, currentVersion) < 0,
  );

  function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function formatCountDelta(next: number, prev: number): string {
    const delta = next - prev;
    if (delta === 0) return '';
    return delta > 0 ? ` (+${delta.toLocaleString()})` : ` (${delta.toLocaleString()})`;
  }

  function formatBytesDelta(next: number, prev: number): string {
    const delta = next - prev;
    if (delta === 0) return '';
    return delta > 0 ? ` (+${bytes(delta)})` : ` (-${bytes(Math.abs(delta))})`;
  }

  async function fetchSync() {
    if (!userstyle.upstreamUrl || syncing) return;
    syncing = true;
    error = null;
    newSourceCode = null;
    try {
      const result = await importFromProviders(userstyle.upstreamUrl);
      newSourceCode = result.sourceCode ?? null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch from upstream.';
    } finally {
      dialogOpen = true;
      syncing = false;
    }
  }

  async function applySync() {
    if (!newSourceCode || saving) return;
    saving = true;
    error = null;
    try {
      await updateUserstyle(rkey, {
        title: userstyle.title,
        description: userstyle.description,
        license: userstyle.license,
        homepageUrl: userstyle.homepageUrl,
        sourceCode: newSourceCode,
        upstreamUrl: userstyle.upstreamUrl,
        stripUpdateUrl: userstyle.stripUpdateUrl,
        previewImage: userstyle.previewImage,
        createdAt: userstyle.createdAt,
      });
      dialogOpen = false;
      newSourceCode = null;
      await invalidateAll();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to apply sync.';
    } finally {
      saving = false;
    }
  }
</script>

<button
  type="button"
  class="btn btn-secondary btn-sm btn-icon"
  aria-label="Sync from upstream"
  title="Sync from upstream"
  disabled={syncing}
  onclick={fetchSync}
>
  {#if syncing}
    <Spinner size="sm" />
  {:else}
    <RefreshCwIcon size={14} />
  {/if}
</button>

<Dialog bind:open={dialogOpen} title="Sync from upstream">
  {#snippet children()}
    {#if error}
      <Alert variant="error">{error}</Alert>
    {/if}
    {#if hasChanges}
      {#if isRegression}
        <Alert variant="warning">The upstream version ({newVersion}) is older than the current version ({currentVersion}). Syncing might downgrade your source code.</Alert>
      {:else}
        <p class="text-muted">The source code has changed since the last sync.</p>
      {/if}
      <table class="diff-table">
        <thead>
          <tr>
            <th></th>
            <th>Current</th>
            <th>Upstream</th>
          </tr>
        </thead>
        <tbody>
          {#if currentVersion || newVersion}
            <tr>
              <td class="diff-label">Version</td>
              <td class="diff-current">{currentVersion ?? '—'}</td>
              <td class="diff-next">{newVersion ?? '—'}</td>
            </tr>
          {/if}
          <tr>
            <td class="diff-label">Lines</td>
            <td class="diff-current">{currentLines.toLocaleString()}</td>
            <td class="diff-next">{newLines.toLocaleString()}<span class="diff-delta">{formatCountDelta(newLines, currentLines)}</span></td>
          </tr>
          <tr>
            <td class="diff-label">Size</td>
            <td class="diff-current">{bytes(currentBytes)}</td>
            <td class="diff-next">{bytes(newBytes)}<span class="diff-delta">{formatBytesDelta(newBytes, currentBytes)}</span></td>
          </tr>
        </tbody>
      </table>
    {:else if newSourceCode !== null}
      <p class="text-muted">No changes detected! This userstyle is already in sync with upstream.</p>
    {/if}
    <a class="upstream-url" href={userstyle.upstreamUrl} target="_blank" rel="noopener noreferrer">
      <ExternalLinkIcon size={11} />
      <span>{userstyle.upstreamUrl}</span>
    </a>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (dialogOpen = false)}>
      {#if hasChanges}Cancel{:else}Close{/if}
    </button>
    {#if hasChanges}
      <button class="btn btn-primary" type="button" onclick={applySync} disabled={saving}>
        {#if saving}<Spinner size="sm" /> Syncing…{:else}Sync{/if}
      </button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .diff-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
    margin: var(--space-3) 0;

    th, td {
      padding: var(--space-2) var(--space-3);
      text-align: left;
    }

    th {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    td {
      border-bottom: 1px solid var(--border-subtle, var(--border));

      &.diff-label {
        font-weight: 600;
        color: var(--fg-muted);
        width: 5rem;
      }

      &.diff-next {
        font-weight: 600;
      }
    }
  }

  .diff-delta {
    font-weight: 400;
    color: var(--fg-muted);
    font-size: var(--text-xs);
  }

  .upstream-url {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    margin-top: var(--space-3);
    max-width: 100%;
    font-size: var(--text-xs);
    color: var(--fg-muted);
    text-decoration: none;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    &:hover {
      color: var(--foreground);
      text-decoration: underline;
    }
  }
</style>
