<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  import { getPreferredActorIdentifier, formatActorLabel } from '$lib/preferences.svelte';
  import { PaginatedList } from '$lib/pagination.svelte';

  import { user, getList, updateList, deleteListRecord, type ListItemView } from '$lib/at';

  import { BackLink, Loading, Alert, Dialog, Spinner } from '$components/ui';
  import { Meta, UserstylesSection, ActorHandle } from '$components';
  import { PencilIcon, Trash2Icon } from '@lucide/svelte';

  let { data, params }: PageProps = $props();

  let list = $state(untrack(() => data.list));
  let isOwner = $derived(user.isLoggedIn && user.did === list.owner);

  const itemsList = new PaginatedList<ListItemView>(untrack(() => data.initial));

  async function fetchPage(cursor?: string) {
    const page = await getList(params.user, params.list, { cursor });
    return { items: page.items, cursor: page.cursor };
  }

  function loadMore() {
    itemsList.load(fetchPage);
  }

  let editing = $state({
    open: false,
    name: '',
    description: '',
    saving: false,
    error: null as string | null,
  });

  function startEditing() {
    editing.name = list.name;
    editing.description = list.description ?? '';
    editing.error = null;
    editing.open = true;
  }

  async function saveEdit() {
    if (editing.saving) return;
    const name = editing.name.trim();
    if (!name) return;
    editing.saving = true;
    editing.error = null;
    try {
      await updateList(params.list, {
        name,
        description: editing.description.trim() || undefined,
        createdAt: list.createdAt,
      });
      list = { ...list, name, description: editing.description.trim() || undefined };
      editing.open = false;
    } catch (e) {
      editing.error = e instanceof Error ? e.message : 'Failed to save list.';
    } finally {
      editing.saving = false;
    }
  }

  let deletion = $state({ dialogOpen: false, running: false, error: null as string | null });

  async function deleteAndRedirect() {
    deletion.dialogOpen = false;
    deletion.running = true;
    deletion.error = null;
    try {
      await deleteListRecord(params.list);
      goto(resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(data.profile) }));
    } catch (e) {
      deletion.error = e instanceof Error ? e.message : 'Failed to delete list.';
      deletion.running = false;
    }
  }
</script>

<Meta
  title={[list.name, formatActorLabel(data.profile)]}
  description={list.description ||
    `A list of userstyles saved by ${formatActorLabel(data.profile)} on userstyles.club.`}
/>

<div class="card">
  <div class="page-header">
    <BackLink
      href={resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(data.profile) })}
      label={formatActorLabel(data.profile)}
    />
    <div class="list-header-row">
      <h1>{list.name}</h1>
      {#if isOwner}
        <div class="list-header__actions">
          <button
            type="button"
            class="btn btn--ghost btn--icon"
            aria-label="Edit list"
            onclick={startEditing}
          >
            <PencilIcon size={14} />
          </button>
          <button
            type="button"
            class="btn btn--ghost btn--icon"
            aria-label="Delete list"
            onclick={() => (deletion.dialogOpen = true)}
          >
            <Trash2Icon size={14} />
          </button>
        </div>
      {/if}
    </div>
  </div>
  {#if list.description}<p class="text-muted">{list.description}</p>{/if}
  <p class="list-meta text-muted">
    <ActorHandle profile={data.profile} style="minimal" /> ·
    {list.itemCount}
    {list.itemCount === 1 ? 'userstyle' : 'userstyles'}
  </p>
  {#if deletion.error}<Alert variant="error">{deletion.error}</Alert>{/if}
</div>

{#if itemsList.loading}
  <div class="section-fill"><Spinner size="lg" /></div>
{:else if itemsList.error}
  <Alert variant="error">{itemsList.error}</Alert>
{:else}
  <UserstylesSection userstyles={itemsList.items.map((item) => item.userstyle)}>
    {#snippet empty()}No userstyles saved to this list yet.{/snippet}
  </UserstylesSection>
  {#if itemsList.hasMore}
    <div class="list-load-more">
      <button
        type="button"
        class="btn btn--outline"
        disabled={itemsList.loadingMore}
        onclick={loadMore}
      >
        <Loading pending={itemsList.loadingMore} idle="Load more" active="Loading…" />
      </button>
    </div>
  {/if}
{/if}

<Dialog bind:open={editing.open} title="Edit list">
  {#snippet children()}
    <div class="form-stack">
      <div class="form-group">
        <label for="edit-list-name" class="form-field-label">Name</label>
        <input id="edit-list-name" type="text" required maxlength="64" bind:value={editing.name} />
      </div>
      <div class="form-group">
        <label for="edit-list-description" class="form-field-label">Description</label>
        <textarea
          id="edit-list-description"
          maxlength="300"
          rows="3"
          bind:value={editing.description}
        ></textarea>
      </div>
      {#if editing.error}<Alert variant="error">{editing.error}</Alert>{/if}
    </div>
  {/snippet}
  {#snippet actions()}
    <button
      type="button"
      class="btn btn--outline"
      onclick={() => (editing.open = false)}
      disabled={editing.saving}
    >
      Cancel
    </button>
    <button type="button" class="btn btn--primary" onclick={saveEdit} disabled={editing.saving}>
      <Loading pending={editing.saving} idle="Save" active="Saving…" />
    </button>
  {/snippet}
</Dialog>

<Dialog bind:open={deletion.dialogOpen} title="Delete list?">
  {#snippet children()}
    <p class="text-muted">
      This will permanently delete <strong>{list.name}</strong>. This cannot be undone.
    </p>
  {/snippet}
  {#snippet actions()}
    <button type="button" class="btn btn--outline" onclick={() => (deletion.dialogOpen = false)}>
      Cancel
    </button>
    <button
      type="button"
      class="btn btn--danger"
      onclick={deleteAndRedirect}
      disabled={deletion.running}
    >
      <Loading pending={deletion.running} idle="Delete" active="Deleting…" />
    </button>
  {/snippet}
</Dialog>

<style>
  .list-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .list-header__actions {
    display: flex;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .list-meta {
    margin-top: var(--space-2);
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .list-load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--space-4);
  }
</style>
