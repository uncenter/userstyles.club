<script lang="ts">
  import { parseCanonicalResourceUri, type CanonicalResourceUri } from '@atcute/lexicons';

  import {
    user,
    getLists,
    getListMemberships,
    createList,
    addUserstyleToList,
    removeUserstyleFromList,
    type ListView,
  } from '$lib/at';

  import { Alert, Spinner, Loading } from '$components/ui';
  import { BookmarkIcon, BookmarkCheckIcon, BookmarkPlusIcon, ListPlusIcon } from '@lucide/svelte';

  interface Props {
    userstyle: { uri: CanonicalResourceUri; cid: string };
  }

  let { userstyle }: Props = $props();

  let state = $state({
    loaded: false,
    loading: false,
    error: null as string | null,
    lists: [] as ListView[],
    // list uri -> the listitem record uri saving this userstyle into it (presence = membership).
    memberItemUri: {} as Record<string, string>,
    pending: {} as Record<string, boolean>,
    creatingFavorites: false,
    showCreateForm: false,
    newListName: '',
    newListDescription: '',
    creatingNewList: false,
    createError: null as string | null,
  });

  let hasAnyList = $derived(Object.keys(state.memberItemUri).length > 0);

  async function ensureLoaded() {
    if (state.loaded || state.loading || !user.did) return;
    state.loading = true;
    state.error = null;
    try {
      const [listsPage, memberships] = await Promise.all([
        getLists(user.did, { limit: 100 }),
        getListMemberships(user.did, userstyle.uri),
      ]);
      state.lists = listsPage.lists;
      state.memberItemUri = Object.fromEntries(memberships.map((m) => [m.listUri, m.itemUri]));
      state.loaded = true;
    } catch (e) {
      state.error = e instanceof Error ? e.message : 'Failed to load your lists.';
    } finally {
      state.loading = false;
    }
  }

  async function toggleList(list: ListView) {
    if (state.pending[list.uri]) return;
    state.pending[list.uri] = true;
    try {
      const itemUri = state.memberItemUri[list.uri];
      if (itemUri) {
        const { rkey } = parseCanonicalResourceUri(itemUri as CanonicalResourceUri);
        await removeUserstyleFromList(rkey);
        delete state.memberItemUri[list.uri];
        list.itemCount = Math.max(0, list.itemCount - 1);
      } else {
        const created = await addUserstyleToList(list.uri, userstyle);
        state.memberItemUri[list.uri] = created.response.uri;
        list.itemCount += 1;
      }
    } catch (e) {
      state.error = e instanceof Error ? e.message : 'Failed to update list.';
    } finally {
      delete state.pending[list.uri];
    }
  }

  // Two sequential PDS writes -- there's no server-side transaction available since every write
  // goes direct-to-PDS. If the second write fails, the new (empty) list persists and the user can
  // retry from the now-populated popover.
  async function createListAndAdd(name: string, description?: string): Promise<void> {
    const created = await createList({ name, description });
    const item = await addUserstyleToList(created.response.uri, userstyle);
    const view: ListView = {
      uri: created.response.uri,
      cid: created.response.cid,
      owner: user.did!,
      name: created.record.name,
      description: created.record.description,
      itemCount: 1,
      createdAt: created.record.createdAt,
      indexedAt: new Date().toISOString(),
    };
    state.lists = [view, ...state.lists];
    state.memberItemUri[view.uri] = item.response.uri;
  }

  async function createFavoritesAndAdd() {
    if (state.creatingFavorites) return;
    state.creatingFavorites = true;
    state.error = null;
    try {
      await createListAndAdd('Favorites');
    } catch (e) {
      state.error = e instanceof Error ? e.message : 'Failed to create Favorites.';
    } finally {
      state.creatingFavorites = false;
    }
  }

  async function createNewList(event: Event) {
    event.preventDefault();
    const name = state.newListName.trim();
    if (state.creatingNewList || !name) return;
    state.creatingNewList = true;
    state.createError = null;
    try {
      await createListAndAdd(name, state.newListDescription.trim() || undefined);
      state.showCreateForm = false;
      state.newListName = '';
      state.newListDescription = '';
    } catch (e) {
      state.createError = e instanceof Error ? e.message : 'Failed to create list.';
    } finally {
      state.creatingNewList = false;
    }
  }
</script>

<div class="save-to-list">
  <button
    type="button"
    class={[
      'btn',
      'btn--lg',
      'save-to-list__trigger',
      hasAnyList ? 'btn--outline' : 'btn--secondary',
    ]}
    popovertarget="save-to-list-popover"
    popovertargetaction="toggle"
    aria-label={hasAnyList ? 'Saved — manage lists' : 'Save to a list'}
    onclick={ensureLoaded}
  >
    {#if hasAnyList}
      <BookmarkCheckIcon size={16} />
    {:else}
      <BookmarkIcon size={16} />
    {/if}
  </button>

  <div id="save-to-list-popover" popover class="save-to-list__dropdown" role="menu">
    {#if state.loading}
      <div class="section-fill"><Spinner size="sm" /></div>
    {:else if state.error}
      <Alert variant="error">{state.error}</Alert>
    {:else}
      {#if state.lists.length === 0}
        <button
          type="button"
          class="save-to-list__row"
          disabled={state.creatingFavorites}
          onclick={createFavoritesAndAdd}
        >
          <BookmarkPlusIcon size={14} />
          <Loading pending={state.creatingFavorites} idle="Add to Favorites" active="Creating…" />
        </button>
      {:else}
        {#each state.lists as list (list.uri)}
          <button
            type="button"
            class="save-to-list__row"
            disabled={state.pending[list.uri]}
            onclick={() => toggleList(list)}
          >
            <input type="checkbox" checked={!!state.memberItemUri[list.uri]} tabindex="-1" />
            <span class="save-to-list__row-label truncate-1">{list.name}</span>
            {#if state.pending[list.uri]}<Spinner size="sm" />{/if}
          </button>
        {/each}
      {/if}

      <hr class="save-to-list__divider" />

      {#if state.showCreateForm}
        <form class="save-to-list__create-form" onsubmit={createNewList}>
          <input
            type="text"
            class="save-to-list__create-input"
            placeholder="List name"
            required
            maxlength="64"
            bind:value={state.newListName}
          />
          <textarea
            class="save-to-list__create-input"
            placeholder="Description (optional)"
            maxlength="300"
            rows="2"
            bind:value={state.newListDescription}
          ></textarea>
          {#if state.createError}<Alert variant="error">{state.createError}</Alert>{/if}
          <div class="save-to-list__create-actions">
            <button
              type="button"
              class="btn btn--outline btn--sm"
              onclick={() => (state.showCreateForm = false)}
            >
              Cancel
            </button>
            <button type="submit" class="btn btn--primary btn--sm" disabled={state.creatingNewList}>
              <Loading pending={state.creatingNewList} idle="Create" active="Creating…" />
            </button>
          </div>
        </form>
      {:else}
        <button
          type="button"
          class="save-to-list__row"
          onclick={() => (state.showCreateForm = true)}
        >
          <ListPlusIcon size={14} /> New list…
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .save-to-list {
    position: relative;

    /* .btn--lg + .btn--icon isn't a supported combo elsewhere -- .btn--icon's padding wins the
       cascade over .btn--lg's, shrinking the button. Set matching square padding directly instead. */
    .save-to-list__trigger {
      padding: var(--space-3);
      aspect-ratio: 1;
    }

    .save-to-list__dropdown {
      position: absolute;
      inset: unset;
      top: calc(100% + var(--space-2));
      right: 0;
      left: auto;
      margin: 0;
      background: var(--float-bg);
      border: none;
      border-radius: var(--radius);
      padding: var(--space-2);
      min-width: 14rem;
      max-width: min(20rem, calc(100vw - 2 * var(--container-pad)));
      max-height: 20rem;
      overflow-y: auto;

      .save-to-list__row {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-2) var(--space-3);
        color: var(--foreground);
        background: none;
        border: none;
        border-radius: var(--radius-sm);
        font: inherit;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: background-color var(--ease-fast);

        &:hover:not(:disabled) {
          background: var(--brand-purple-bg);
          color: var(--brand-purple);
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .save-to-list__row-label {
          flex: 1;
          min-width: 0;
        }
      }

      .save-to-list__divider {
        border: none;
        border-top: 1px solid var(--border);
        margin: var(--space-2) 0;
      }

      .save-to-list__create-form {
        display: grid;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);

        .save-to-list__create-input {
          width: 100%;
        }

        .save-to-list__create-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
        }
      }
    }
  }
</style>
