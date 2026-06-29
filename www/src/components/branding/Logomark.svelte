<script lang="ts">
  import logomark from '$assets/logomark.svg?raw';

  interface Props {
    size?: string;
  }
  let { size = '2.5rem' }: Props = $props();
</script>

<span class="mark" style="height: {size}; width: {size}" aria-hidden="true">
  {@html logomark}
</span>

<style>
  .mark {
    display: inline-block;
    flex-shrink: 0;
  }

  .mark :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
