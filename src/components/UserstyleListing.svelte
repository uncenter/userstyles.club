<script lang="ts">
  import { type UserstyleRecord } from '$lib/at';

  interface Props {
    record: UserstyleRecord;
  }

  let { record }: Props = $props();

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }
</script>

<section class="panel">
  <p style="margin: 0 0 0.25rem; line-height: 1.5;">{record.value.title}</p>
  <p class="muted" style="margin: 0 0 0.35rem;">{formatDate(record.value.createdAt)}</p>
  <p style="margin: 0 0 0.35rem; overflow-wrap: anywhere;"><code>{record.uri}</code></p>
</section>
