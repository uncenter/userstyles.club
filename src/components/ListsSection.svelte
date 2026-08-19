<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type ProfileView, type ListView } from '$lib/at';
  import ListCard from './ListCard.svelte';

  interface Props {
    lists: ListView[];
    owner: ProfileView;
    empty?: Snippet;
  }

  let { lists, owner, empty }: Props = $props();
</script>

<section class="lists-section">
  {#if lists.length === 0}
    <div class="section-fill">
      {#if empty}{@render empty()}{:else}No lists yet.{/if}
    </div>
  {:else}
    <ul class="lists-section__list list-reset accent-cycle">
      {#each lists as list (list.uri)}
        <li class="lists-section__list-item">
          <ListCard {list} {owner} />
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .lists-section {
    margin-top: var(--space-6);
    margin-bottom: var(--space-5);

    .lists-section__list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-4);
    }
  }
</style>
