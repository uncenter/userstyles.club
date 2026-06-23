<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    value: number | undefined;
    label?: string;
    text?: Snippet;
  };

  let { value: rating, label, text }: Props = $props();
</script>

<span
  class="star-rating"
  aria-label={label}
>
  {#each [1, 2, 3, 4, 5] as n}
    {@const isFilled = rating !== undefined && rating >= n - 0.25}
    {@const isHalf = rating !== undefined && !isFilled && rating >= n - 0.75}
    <span class="star" class:filled={isFilled} class:half={isHalf}>★</span>
  {/each}
  {#if text}
    {@render text()}
  {/if}
</span>

<style>
  .star-rating {
    display: inline-flex;
    align-items: center;
    gap: 0.15em;

    .star {
      color: var(--border);
      line-height: 1;

      &.filled {
        color: var(--pastel-yellow);
      }

      &.half {
        background: linear-gradient(to right, var(--pastel-yellow) 50%, var(--border) 50%);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
    }
  }
</style>
