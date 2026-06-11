<script lang="ts">
  interface Props {
    rating: number;
    count?: number;
    showValue?: boolean;
  }

  let { rating, count, showValue = true }: Props = $props();
</script>

<span
  class="star-rating"
  aria-label="{rating.toFixed(1)} out of 5{count !== undefined
    ? `, ${count} rating${count !== 1 ? 's' : ''}`
    : ''}"
>
  {#each [1, 2, 3, 4, 5] as n}
    {@const isFilled = rating >= n - 0.25}
    {@const isHalf = !isFilled && rating >= n - 0.75}
    <span class="star" class:filled={isFilled} class:half={isHalf}>★</span>
  {/each}
  {#if showValue}
    <span class="average">{rating.toFixed(1)}</span>
    {#if count !== undefined}
      <span class="count">({count})</span>
    {/if}
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
        color: var(--butter-vivid);
      }

      &.half {
        background: linear-gradient(to right, var(--butter-vivid) 50%, var(--border) 50%);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
    }

    .average {
      margin-left: 0.25em;
      font-weight: 700;
      color: var(--foreground);
    }

    .count {
      margin-left: 0.5ch;
      color: var(--fg-muted);
    }
  }
</style>
