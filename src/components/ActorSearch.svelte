<script lang="ts">
  import type { AppBskyActorDefs } from '@atcute/bluesky';
  import { getPublicClient } from '$lib/at';

  interface Props {
    onSelect?: (actor: AppBskyActorDefs.ProfileViewBasic) => void;
  }

  let { onSelect }: Props = $props();

  let query = $state('');
  let isSearching = $state(false);
  let results = $state<AppBskyActorDefs.ProfileViewBasic[]>([]);
  let timer: ReturnType<typeof setTimeout>;

  function handleInput() {
    clearTimeout(timer);

    if (!query.trim()) {
      results = [];
      return;
    }

    timer = setTimeout(async () => {
      isSearching = true;
      try {
        const response = await getPublicClient().get('app.bsky.actor.searchActorsTypeahead', {
          params: {
            q: query,
            limit: 8
          }
        });
        if (response.ok) {
          results = response.data.actors;
        }
      } catch {
        results = [];
      } finally {
        isSearching = false;
      }
    }, 250);
  }

  function selectActor(actor: AppBskyActorDefs.ProfileViewBasic) {
    onSelect?.(actor);
    query = '';
    results = [];
  }
</script>

<div style="position: relative;">
  <input type="text" bind:value={query} oninput={handleInput} placeholder="Handle or name" />

  {#if isSearching}
    <!-- <p class="muted" style="margin: 0.45rem 0 0; font-size: 0.9rem;">Searching...</p> -->
  {/if}

  {#if results.length > 0}
    <div class="panel" style="margin-top: 0.5rem; overflow: hidden; position: absolute; z-index: 999;">
      {#each results as actor}
        <button
          type="button"
          class="actor-row"
          onclick={() => selectActor(actor)}
        >
          {#if actor.avatar}
            <img src={actor.avatar} alt={actor.handle} class="avatar" />
          {:else}
            <div class="avatar fallback">{actor.handle[0]?.toUpperCase() ?? '?'}</div>
          {/if}
          <span style="display: grid; gap: 0.15rem; text-align: left;">
            <strong style="font-size: 0.95rem;">{actor.displayName ?? actor.handle}</strong>
            <span class="muted" style="font-size: 0.85rem;">@{actor.handle}</span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .actor-row {
    width: 100%;
    display: flex;
    gap: 0.7rem;
    align-items: center;
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--line);
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0.65rem;
  }

  .actor-row:last-child {
    border-bottom: 0;
  }

  .actor-row:hover {
    background: #f3f3f3;
  }

  .fallback {
    display: grid;
    place-items: center;
    font-weight: 700;
  }
</style>
