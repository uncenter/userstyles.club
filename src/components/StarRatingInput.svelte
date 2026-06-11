<script lang="ts">
  interface Props {
    value?: number;
    name?: string;
  }

  let { value = $bindable(), name = 'rating' }: Props = $props();
</script>

<fieldset class="stars">
  <legend class="field-label">Rating</legend>
  {#each [5, 4, 3, 2, 1] as n}
    <label class="star-label">
      <input
        type="radio"
        class="sr-only"
        {name}
        value={n}
        bind:group={value}
        onclick={() => {
          if (value === n) value = undefined;
        }}
      />
      ★
    </label>
  {/each}
</fieldset>

<style>
  .stars {
    display: flex;
    flex-direction: row-reverse;
    justify-content: start;
    gap: var(--space-1);
    border: none;
    padding: 0;
    margin: 0;

    .star-label {
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: var(--border);
      transition: color 0.1s;

      &:has(:checked),
      &:has(:checked) ~ .star-label {
        color: var(--butter-vivid);
      }
    }

    &:hover .star-label {
      color: var(--border);
    }

    .star-label:hover,
    .star-label:hover ~ .star-label {
      color: var(--butter-vivid);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  }
</style>
