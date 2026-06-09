<script lang="ts">
  import type { UserstyleRecord } from '$lib/at';
  import UserstylesListItem from './UserstylesListItem.svelte';

  interface Props {
    userstyles: Array<UserstyleRecord>;
  }

  let { userstyles }: Props = $props();
</script>

<ul>
  {#each userstyles as userstyle}
    <li><UserstylesListItem record={userstyle} /></li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  li:nth-child(6n + 1) {
    --card-hover-color: var(--lavender-vivid);
  }
  li:nth-child(6n + 2) {
    --card-hover-color: var(--mint-vivid);
  }
  li:nth-child(6n + 3) {
    --card-hover-color: var(--peach-vivid);
  }
  li:nth-child(6n + 4) {
    --card-hover-color: var(--butter-vivid);
  }
  li:nth-child(6n + 5) {
    --card-hover-color: var(--sky-vivid);
  }
  li:nth-child(6n + 6) {
    --card-hover-color: var(--rose-vivid);
  }
</style>
