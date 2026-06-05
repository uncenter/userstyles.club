<script lang="ts">
  import { resolve } from '$app/paths';

  import { type UserstyleRecord } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import { Badge } from '$components';

  interface Props {
    record: UserstyleRecord;
  }

  let { record }: Props = $props();

  let uri = $derived.by(() => parseResourceUri(record.uri));

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<a
  class="userstyle-card-wrapper"
  href={resolve('/style/[user=actor]/[style=rkey]', { user: uri.repo, style: uri.rkey! })}
>
  <article class="userstyle-card">
    <header class="userstyle-card-header">
      <h3 class="userstyle-title">
        {record.value.title}
      </h3>
    </header>
    <footer class="userstyle-card-footer">
      <Badge variant="secondary"
        >{formatDate(record.value.updatedAt ?? record.value.createdAt)}</Badge
      >
      <Badge variant="secondary">{record.value.sourceCode.split('\n').length} lines</Badge>
    </footer>
  </article>
</a>

<style>
  .userstyle-card-wrapper {
    text-decoration: none;
  }
  .userstyle-card {
    background: var(--card-bg);
    border: 2px solid var(--foreground);
    padding: var(--space-4) var(--space-5);
    box-shadow: var(--shadow-sm);
    filter: url('#rough');
    transition:
      transform var(--ease-fast),
      box-shadow var(--ease-fast);

    &:hover {
      transform: translate(-2px, -2px);
      border-color: var(--card-hover-color, var(--accent));
      box-shadow: 6px 7px 0 var(--card-hover-color, var(--accent));
    }

    .userstyle-card-header {
      margin-bottom: var(--space-2);

      .userstyle-title {
        font-size: var(--text-base);
        font-weight: 600;
        margin: 0;
      }
    }

    .userstyle-card-footer {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
  }
</style>
