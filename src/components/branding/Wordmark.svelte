<script lang="ts">
  import wordmark from '$assets/wordmark.svg?raw';

  interface Props {
    height?: string;
  }
</script>

{@html wordmark}

<style>
  :global .wordmark {
    height: var(--height, 2rem);
    width: auto;
    display: inline-block;
    vertical-align: middle;

    .letter:nth-child(6n + 1) {
      fill: var(--lavender-vivid);
    }
    .letter:nth-child(6n + 2) {
      fill: var(--rose-vivid);
    }
    .letter:nth-child(6n + 3) {
      fill: var(--sky-vivid);
    }
    .letter:nth-child(6n + 4) {
      fill: var(--peach-vivid);
    }
    .letter:nth-child(6n + 5) {
      fill: var(--mint-vivid);
    }
    .letter:nth-child(6n + 6) {
      fill: var(--butter-vivid);
    }
  }
</style>
