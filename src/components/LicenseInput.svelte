<script lang="ts">
  import * as licenses from 'spdx-license-list';
  import { slide } from 'svelte/transition';
  import { Alert } from './ui';

  interface Props {
    value: string | undefined;
    id?: string;
    required?: boolean;
  }

  let el: HTMLInputElement | null = null;
  let warning: string | null = $state(null);

  $effect(() => {
    if (el === null) return;
    el.addEventListener('focusout', () => {
      setTimeout(() => {
        if (el!.value.trim() && !Object.keys(licenses).includes(el!.value)) {
          warning =
            "Are you sure that license exists? I can't seem to find it in the SPDX database.";
        } else {
          warning = null;
        }
      }, 200);
    });
  });

  let { value = $bindable(), id, required }: Props = $props();
</script>

<input
  type="text"
  list="licenses"
  {id}
  {required}
  bind:this={el}
  bind:value
  class="license-input"
/>
<datalist id="licenses">
  {#each Object.keys(licenses).sort((a, b) => a.length - b.length) as license}
    <option value={license}></option>
  {/each}
</datalist>

{#if warning}
  <div transition:slide={{ duration: 150 }}>
    <Alert variant="warning">{warning}</Alert>
  </div>
{/if}

<style>
</style>
