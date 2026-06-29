<script lang="ts">
  import { ArrowLeftIcon } from '@lucide/svelte';

  interface Props {
    href: string;
    label?: string;
  }

  let { href, label = 'Back' }: Props = $props();
</script>

<a {href} class="back-link">
  <ArrowLeftIcon size={14} />
  {label}
</a>

<style>
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--fg-muted);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
</style>
