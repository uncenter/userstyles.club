<script lang="ts">
  import Logomark from './Logomark.svelte';
  import Wordmark from './Wordmark.svelte';

  interface Props {
    size?: string;
  }
  let { size }: Props = $props();
</script>

<div class="logo-wrapper">
  <Logomark {size} /><Wordmark --height={size} />
</div>

<style>
  .logo-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }
</style>
