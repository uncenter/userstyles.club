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
  <p style="margin: 0 0 0.25rem; line-height: 1.5;"><a href={resolve('/style/[user=actor]/[style=rkey]', { user: uri.repo, style: uri.rkey! })}>{record.value.title}</a></p>
  <p class="muted" style="margin: 0 0 0.35rem;">Last updated {formatDate(record.value.updatedAt ?? record.value.createdAt)}</p>
  <p class="muted" style="margin: 0 0 0.35rem;">{record.value.sourceCode.split('\n').length} lines</p>
</section>
