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
    <div class="section-fill">
      {#if empty}{@render empty()}{:else}No userstyles yet.{/if}
    </div>
  {:else}
    <ul class="userstyles-section__list list-reset">
      {#each userstyles as userstyle}
        <li class="userstyles-section__list-item"><UserstylesListItem {userstyle} {author} /></li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .userstyles-section {
    margin-top: var(--space-6);
    margin-bottom: var(--space-5);

    .userstyles-section__list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-4);

      .userstyles-section__list-item:nth-child(4n + 1) {
        --card-accent-color: var(--brand-purple);
      }
      .userstyles-section__list-item:nth-child(4n + 2) {
        --card-accent-color: var(--brand-red);
      }
      .userstyles-section__list-item:nth-child(4n + 3) {
        --card-accent-color: var(--brand-green);
      }
      .userstyles-section__list-item:nth-child(4n + 4) {
        --card-accent-color: var(--brand-blue);
      }
    }
  }
</style>
