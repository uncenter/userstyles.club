<script lang="ts">
  import { ArrowLeftIcon } from '@lucide/svelte';

  interface Props {
    href: string;
    label?: string;
  }

  let { href, label = 'Back' }: Props = $props();
</script>

<a {href} class="link link--quiet link--muted link--sm link--icon">
  <ArrowLeftIcon size={14} />
  {label}
</a>
