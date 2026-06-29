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

    .letter:nth-child(4n + 1) {
      fill: var(--brand-purple);
    }
    .letter:nth-child(4n + 2) {
      fill: var(--brand-red);
    }
    .letter:nth-child(4n + 3) {
      fill: var(--brand-green);
    }
    .letter:nth-child(4n + 4) {
      fill: var(--brand-blue);
    }
  }
</style>
