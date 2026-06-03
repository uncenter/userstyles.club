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

<article class="card">
  <header>
    <h3><a href={resolve('/style/[user=actor]/[style=rkey]', { user: uri.repo, style: uri.rkey! })}>{record.value.title}</a></h3>
  </header>
  <footer class="hstack">
    <span class="badge" data-variant="secondary">{formatDate(record.value.updatedAt ?? record.value.createdAt)}</span>
    <span class="badge" data-variant="secondary">{record.value.sourceCode.split('\n').length} lines</span>
  </footer>
</article>
