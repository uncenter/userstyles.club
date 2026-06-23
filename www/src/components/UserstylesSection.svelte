<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ProfileView, UserstyleRecord } from '$lib/at';
  import UserstylesListItem from './UserstylesListItem.svelte';

  interface Props {
    userstyles: UserstyleRecord[];
    author?: ProfileView;
    empty?: Snippet;
  }

  let { userstyles, author, empty }: Props = $props();
</script>

<section class="userstyles-section">
  {#if userstyles.length === 0}
    <div class="empty-state">
      {#if empty}{@render empty()}{:else}No userstyles yet.{/if}
    </div>
  {:else}
    <ul>
      {#each userstyles as userstyle}
        <li><UserstylesListItem {userstyle} {author} /></li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .userstyles-section {
    margin-top: var(--space-6);
    margin-bottom: var(--space-5);

    .empty-state {
      display: flex;
      justify-content: center;
      padding: var(--space-8) 0;
    }

    .empty-state {
      color: var(--fg-muted);
    }

    ul {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-4);

      li:nth-child(4n + 1) {
        --card-accent-color: var(--brand-purple);
      }
      li:nth-child(4n + 2) {
        --card-accent-color: var(--brand-red);
      }
      li:nth-child(4n + 3) {
        --card-accent-color: var(--brand-green);
      }
      li:nth-child(4n + 4) {
        --card-accent-color: var(--brand-blue);
      }
    }
  }
</style>
