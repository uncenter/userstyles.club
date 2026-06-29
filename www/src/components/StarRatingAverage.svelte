<script lang="ts">
  import StarRating from './StarRating.svelte';

  interface Props {
    average: number | undefined;
    count?: number;
    showValue?: boolean;
  }

  let { average, count, showValue = true }: Props = $props();
</script>

<StarRating
  value={average}
  label={average !== undefined
    ? `${average.toFixed(1)} out of 5${count !== undefined ? `, ${count} rating${count !== 1 ? 's' : ''}` : ''}`
    : 'No ratings yet'}
>
  {#snippet text()}
    {#if showValue}
      {#if average !== undefined}
        <span class="star-rating-average__value">{average.toFixed(1)}</span>
        {#if count !== undefined}
          <span class="star-rating-average__count">({count})</span>
        {/if}
      {:else}
        <span class="star-rating-average__value star-rating-average__value--na">n/a</span>
      {/if}
    {/if}
  {/snippet}
</StarRating>

<style>
  .star-rating-average__value {
    margin-left: 0.25em;
    font-weight: 700;
    color: var(--foreground);

    &.star-rating-average__value--na {
      color: var(--fg-muted);
      font-weight: 400;
    }
  }

  .star-rating-average__count {
    margin-left: 0.5ch;
    color: var(--fg-muted);
  }
</style>
