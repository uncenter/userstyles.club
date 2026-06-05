<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
  }
  let { size = 'md' }: Props = $props();
</script>

<span class="spinner {size}" role="status" aria-label="Loading"></span>

<style>
  .spinner {
    display: inline-block;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, currentColor 20%, transparent);
    border-top-color: currentColor;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;

    &.sm {
      width: 0.875rem;
      height: 0.875rem;
    }
    &.md {
      width: 1.5rem;
      height: 1.5rem;
    }
    &.lg {
      width: 2.75rem;
      height: 2.75rem;
      border-width: 3px;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
