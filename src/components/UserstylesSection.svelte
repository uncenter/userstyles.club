<script lang="ts">
  import type { Snippet } from 'svelte';
  import { parseCanonicalResourceUri } from '@atcute/lexicons';
  import { getProfiles, type ProfileView, type UserstyleView } from '$lib/at';
  import UserstylesListItem from './UserstylesListItem.svelte';

  interface Props {
    userstyles: UserstyleView[];
    author?: ProfileView;
    empty?: Snippet;
  }

  let { userstyles, author, empty }: Props = $props();

  // When a single author isn't already known (e.g. mixed-author feeds like Explore), batch-fetch every author's profile once instead of letting each list item fetch its own.
  let authors = $derived(
    author
      ? undefined
      : await getProfiles([
          ...new Set(userstyles.map((u) => parseCanonicalResourceUri(u.uri).repo)),
        ]),
  );
</script>

<section class="userstyles-section">
  {#if userstyles.length === 0}
    <div class="section-fill">
      {#if empty}{@render empty()}{:else}No userstyles yet.{/if}
    </div>
  {:else}
    <ul class="userstyles-section__list list-reset accent-cycle">
      {#each userstyles as userstyle}
        <li class="userstyles-section__list-item">
          <UserstylesListItem
            {userstyle}
            author={author ?? authors?.get(parseCanonicalResourceUri(userstyle.uri).repo)!}
          />
        </li>
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
    }
  }
</style>
