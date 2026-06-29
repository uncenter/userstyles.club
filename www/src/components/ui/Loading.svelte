<script lang="ts">
  import type { Snippet } from 'svelte';
  import Spinner from './Spinner.svelte';

  interface Props {
    pending: boolean;
    idle: string | Snippet;
    active?: string;
  }

  let { pending, idle, active }: Props = $props();
</script>

{#if pending}
  <Spinner size="sm" />{#if active}{active}{/if}
{:else if typeof idle === 'string'}{idle}{:else}{@render idle()}{/if}
