<script lang="ts">
  import { base, resolve } from '$app/paths';
  import { type UserstyleRecord } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  interface Props {
    record: UserstyleRecord;
  }

  let { record }: Props = $props();

  let uri = $derived.by(() => parseResourceUri(record.uri));

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }
</script>

<section class="panel">
  <p style="margin: 0 0 0.25rem; line-height: 1.5;">{record.value.title}</p>
  <p class="muted" style="margin: 0 0 0.35rem;">{formatDate(record.value.createdAt)}</p>
  <p style="margin: 0 0 0.35rem; overflow-wrap: anywhere;"><a href={resolve('/style/[actor]/[rkey]', { actor: uri.repo, rkey: uri.rkey! })}><code>{record.uri}</code></a></p>
</section>
