<script lang="ts">
  interface Props {
    src: string;
    alt?: string;
  }

  let { src, alt }: Props = $props();
  let error = $state(false);

  $effect(() => {
    src;
    error = false;
  });
</script>

{#if src && !error}
  <img {src} {alt} class="preview-image" onerror={() => (error = true)} />
{/if}

<style>
  .preview-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    max-height: 40vh;
  }
</style>
