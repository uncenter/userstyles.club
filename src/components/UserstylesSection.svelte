<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ProfileView, UserstyleRecord } from '$lib/at';
  import { Spinner, Alert } from '$components/ui';
  import UserstylesListItem from './UserstylesListItem.svelte';

  interface Props {
    userstyles: UserstyleRecord[];
    author?: ProfileView;
    loading?: boolean;
    error?: string | null;
    empty?: Snippet;
  }

  let { userstyles, author, loading = false, error = null, empty }: Props = $props();
</script>

<section class="userstyles-section">
  {#if loading}
    <div class="loading-state"><Spinner /></div>
  {:else if error}
    <Alert variant="error">{error}</Alert>
  {:else if userstyles.length === 0}
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

    .loading-state,
    .empty-state {
      display: flex;
      justify-content: center;
      padding: var(--space-6) 0;
    }

    .empty-state {
      color: var(--fg-muted);
    }

    ul {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);

      li:nth-child(6n + 1) { --card-hover-color: var(--lavender-vivid); }
      li:nth-child(6n + 2) { --card-hover-color: var(--mint-vivid); }
      li:nth-child(6n + 3) { --card-hover-color: var(--peach-vivid); }
      li:nth-child(6n + 4) { --card-hover-color: var(--butter-vivid); }
      li:nth-child(6n + 5) { --card-hover-color: var(--sky-vivid); }
      li:nth-child(6n + 6) { --card-hover-color: var(--rose-vivid); }
    }
  }
</style>
