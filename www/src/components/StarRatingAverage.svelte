<script lang="ts">
  import StarRating from "./StarRating.svelte";

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
        <span class="average">{average.toFixed(1)}</span>
        {#if count !== undefined}
          <span class="count">({count})</span>
        {/if}
      {:else}
        <span class="average na">n/a</span>
      {/if}
    {/if}
  {/snippet}
</StarRating>

<style>
  .average {
    margin-left: 0.25em;
    font-weight: 700;
    color: var(--foreground);

    &.na {
      color: var(--fg-muted);
      font-weight: 400;
    }
  }

  .count {
    margin-left: 0.5ch;
    color: var(--fg-muted);
  }
</style>
