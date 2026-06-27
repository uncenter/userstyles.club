<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  import { joinPageTitle } from '$lib/constants';
  import { deleteUserstyle, updateUserstyle, user } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';
  import { importFromProviders } from '../../../../new/import/providers';
  import { getUsercssMetadata } from '../../../../new/import/metadata';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { ExternalLinkIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from '@lucide/svelte';

  import SyncDiffTable from './SyncDiffTable.svelte';

  let { data }: PageProps = $props();
  let userstyle = $derived(data.userstyle.value);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto(resolve('/login'));
      return;
    }
    if (user.did && user.did !== data.profile.did) {
      goto(resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style }));
    }
  });

  let sync = $state({
    fetching: false,
    saving: false,
    dialogOpen: false,
    error: null as string | null,
    newSourceCode: null as string | null,
  });

  let diff = $derived.by(() => {
    const currentVersion = getUsercssMetadata(userstyle.sourceCode).version;
    const newVersion = sync.newSourceCode
      ? getUsercssMetadata(sync.newSourceCode).version
      : undefined;
    return {
      hasChanges: sync.newSourceCode !== null && sync.newSourceCode !== userstyle.sourceCode,
      currentLines: userstyle.sourceCode.split('\n').length,
      currentBytes: userstyle.sourceCode.length,
      newLines: sync.newSourceCode?.split('\n').length ?? 0,
      newBytes: sync.newSourceCode?.length ?? 0,
      currentVersion,
      newVersion,
      isRegression:
        !!currentVersion && !!newVersion && compareVersions(newVersion, currentVersion) < 0,
    };
  });

  function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  async function fetchSync() {
    if (!userstyle.upstreamUrl || sync.fetching) return;
    sync.fetching = true;
    sync.error = null;
    sync.newSourceCode = null;
    try {
      const result = await importFromProviders(userstyle.upstreamUrl);
      sync.newSourceCode = result.sourceCode ?? null;
    } catch (e) {
      sync.error = e instanceof Error ? e.message : 'Failed to fetch from upstream.';
    } finally {
      sync.dialogOpen = true;
      sync.fetching = false;
    }
  }

  async function applySync() {
    if (!sync.newSourceCode || sync.saving) return;
    sync.saving = true;
    sync.error = null;
    try {
      await updateUserstyle(data.style, {
        title: userstyle.title,
        description: userstyle.description,
        license: userstyle.license,
        homepageUrl: userstyle.homepageUrl,
        sourceCode: sync.newSourceCode,
        upstreamUrl: userstyle.upstreamUrl,
        stripUpdateUrl: userstyle.stripUpdateUrl,
        previewImage: userstyle.previewImage,
        createdAt: userstyle.createdAt,
      });
      sync.dialogOpen = false;
      sync.newSourceCode = null;
      await invalidateAll();
    } catch (e) {
      sync.error = e instanceof Error ? e.message : 'Failed to apply sync.';
    } finally {
      sync.saving = false;
    }
  }

  let deletion = $state({
    dialogOpen: false,
    running: false,
    error: null as string | null,
  });

  async function deleteAndRedirect() {
    deletion.dialogOpen = false;
    deletion.running = true;
    deletion.error = null;
    try {
      await deleteUserstyle(data.style);
      goto(resolve('/'));
    } catch (e) {
      deletion.error = e instanceof Error ? e.message : 'Failed to delete userstyle.';
      deletion.running = false;
    }
  }
</script>

<svelte:head>
  <title>{joinPageTitle('Manage', userstyle.title)}</title>
</svelte:head>

<div class="page-section">
  <div class="manage-header">
    <a
      class="back-link text-muted"
      href={resolve('/style/[user=actor]/[style=rkey]', {
        user: getPreferredActorIdentifier(data.profile),
        style: data.style,
      })}
    >← {userstyle.title}</a>
    <h1>Manage</h1>
  </div>
</div>

<div class="page-section">
  <ul class="action-list">
    <li class="action-item">
      <div class="action-info">
        <p class="action-title">Edit</p>
        <p class="action-desc text-muted">Update title, description, license, source code, and more.</p>
      </div>
      <a
        href={resolve('/style/[user=actor]/[style=rkey]/edit', {
          user: getPreferredActorIdentifier(data.profile),
          style: data.style,
        })}
        class="btn btn-secondary btn-lg"
      >
        <PencilIcon size={14} /> Edit
      </a>
    </li>

    {#if userstyle.upstreamUrl}
      <li class="action-item">
        <div class="action-info">
          <p class="action-title">Sync</p>
          <p class="action-desc text-muted">Fetch the latest source code from the upstream URL.</p>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-lg"
          disabled={sync.fetching}
          onclick={fetchSync}
        >
          {#if sync.fetching}<Spinner size="sm" /> Syncing…{:else}<RefreshCwIcon size={14} /> Sync{/if}
        </button>
      </li>
    {/if}
  </ul>
</div>

<div class="page-section danger-zone">
  <h2>Danger Zone</h2>
  <ul class="action-list">
    <li class="action-item">
      <div class="action-info">
        <p class="action-title">Delete</p>
        <p class="action-desc text-muted">Permanently delete this userstyle. This cannot be undone.</p>
      </div>
      <button
        type="button"
        class="btn btn-danger btn-lg"
        onclick={() => (deletion.dialogOpen = true)}
        disabled={deletion.running}
      >
        {#if deletion.running}<Spinner size="sm" /> Deleting…{:else}<Trash2Icon size={14} /> Delete{/if}
      </button>
    </li>
  </ul>

  {#if deletion.error}
    <Alert variant="error">{deletion.error}</Alert>
  {/if}
</div>

<Dialog bind:open={sync.dialogOpen} title="Sync from upstream">
  {#snippet children()}
    {#if sync.error}
      <Alert variant="error">{sync.error}</Alert>
    {/if}
    {#if diff.hasChanges}
      {#if diff.isRegression}
        <Alert variant="warning">The upstream version ({diff.newVersion}) is older than the current version ({diff.currentVersion}). Syncing might downgrade your source code.</Alert>
      {:else}
        <p class="text-muted">The source code has changed since the last sync.</p>
      {/if}
      <SyncDiffTable
        currentLines={diff.currentLines}
        currentBytes={diff.currentBytes}
        newLines={diff.newLines}
        newBytes={diff.newBytes}
        currentVersion={diff.currentVersion}
        newVersion={diff.newVersion}
      />
    {:else if sync.newSourceCode !== null}
      <p class="text-muted">No changes detected! This userstyle is already in sync with upstream.</p>
    {/if}
    <a class="upstream-url" href={userstyle.upstreamUrl} target="_blank" rel="noopener noreferrer">
      <ExternalLinkIcon size={11} />
      <span>{userstyle.upstreamUrl}</span>
    </a>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (sync.dialogOpen = false)}>
      {#if diff.hasChanges}Cancel{:else}Close{/if}
    </button>
    {#if diff.hasChanges}
      <button class="btn btn-primary" type="button" onclick={applySync} disabled={sync.saving}>
        {#if sync.saving}<Spinner size="sm" /> Syncing…{:else}Sync{/if}
      </button>
    {/if}
  {/snippet}
</Dialog>

<Dialog bind:open={deletion.dialogOpen} title="Delete userstyle?">
  {#snippet children()}
    <p class="text-muted">
      This will permanently delete <strong>{userstyle.title}</strong>. This cannot be undone.
    </p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (deletion.dialogOpen = false)}>
      Cancel
    </button>
    <button class="btn btn-danger" type="button" onclick={deleteAndRedirect} disabled={deletion.running}>
      {#if deletion.running}<Spinner size="sm" /> Deleting…{:else}Delete{/if}
    </button>
  {/snippet}
</Dialog>

<style>
  .manage-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .back-link {
    font-size: var(--text-sm);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .action-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
    padding: var(--space-4) 0;

    & + & {
      border-top: 1px solid var(--border);
    }
  }

  .action-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .action-title {
    font-weight: 600;
  }

  .action-desc {
    font-size: var(--text-sm);
  }

  .danger-zone {
    h2 {
      font-size: var(--text-base);
      color: var(--danger);
      margin-bottom: var(--space-2);
    }
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
