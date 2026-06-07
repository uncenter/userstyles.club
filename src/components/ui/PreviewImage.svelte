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
    max-height: 360px;
    object-fit: cover;
    border: 2px solid var(--border);
    box-shadow: var(--shadow-md);
  }
</style>
