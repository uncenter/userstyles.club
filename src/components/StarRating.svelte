<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    value: number | undefined;
    label?: string;
    text?: Snippet;
  }

  let { value: rating, label, text }: Props = $props();
</script>

<span class="star-rating" aria-label={label}>
  {#each [1, 2, 3, 4, 5] as n}
    {@const isFilled = rating !== undefined && rating >= n - 0.25}
    {@const isHalf = rating !== undefined && !isFilled && rating >= n - 0.75}
    <span
      class="star-rating__star"
      class:star-rating__star--filled={isFilled}
      class:star-rating__star--half={isHalf}>★</span
    >
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

    .star-rating__star {
      color: var(--border);
      line-height: 1;

      &.star-rating__star--filled {
        color: var(--pastel-yellow);
      }

      &.star-rating__star--half {
        background: linear-gradient(to right, var(--pastel-yellow) 50%, var(--border) 50%);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
    }
  }
</style>
