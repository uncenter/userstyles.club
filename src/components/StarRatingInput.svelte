<script lang="ts">
  interface Props {
    value?: number;
    name?: string;
    onchange?: (value: number | undefined) => void;
  }

  let { value = $bindable(), name = 'rating', onchange }: Props = $props();
</script>

<fieldset class="star-rating-input">
  <legend class="sr-only">Rating</legend>
  {#each [5, 4, 3, 2, 1] as n}
    <label class="star-rating-input__label">
      <input
        type="radio"
        class="sr-only"
        {name}
        value={n}
        checked={value === n}
        onclick={() => {
          value = value === n ? undefined : n;
          onchange?.(value);
        }}
      />
      ★
    </label>
  {/each}
</fieldset>

<style>
  .star-rating-input {
    display: flex;
    flex-direction: row-reverse;
    justify-content: start;
    gap: var(--space-1);
    border: none;
    padding: 0;
    margin: 0;

    .star-rating-input__label {
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: var(--border);
      transition: color 0.1s;

      &:has(:checked),
      &:has(:checked) ~ .star-rating-input__label {
        color: var(--pastel-yellow);
      }
    }

    &:hover .star-rating-input__label {
      color: var(--border);
    }

    .star-rating-input__label:hover,
    .star-rating-input__label:hover ~ .star-rating-input__label {
      color: var(--pastel-yellow);
    }
  }
</style>
