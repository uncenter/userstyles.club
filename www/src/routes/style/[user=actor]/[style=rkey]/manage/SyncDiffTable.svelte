<script lang="ts">
  import bytes from 'pretty-bytes';

  interface Props {
    currentLines: number;
    currentBytes: number;
    newLines: number;
    newBytes: number;
    currentVersion?: string;
    newVersion?: string;
  }

  let { currentLines, currentBytes, newLines, newBytes, currentVersion, newVersion }: Props =
    $props();

  function formatDelta(next: number, prev: number, fmt: (n: number) => string): string {
    const delta = next - prev;
    if (delta === 0) return '';
    return delta > 0 ? ` (+${fmt(delta)})` : ` (-${fmt(Math.abs(delta))})`;
  }

  function getDeltaDirection(next: number, prev: number): 'positive' | 'negative' | '' {
    if (next > prev) return 'positive';
    if (next < prev) return 'negative';
    return '';
  }
</script>

<table class="diff-table">
  <thead>
    <tr>
      <th></th>
      <th>Current</th>
      <th>Upstream</th>
    </tr>
  </thead>
  <tbody>
    {#if currentVersion || newVersion}
      <tr>
        <td class="diff-label">Version</td>
        <td class="diff-current">{currentVersion ?? '—'}</td>
        <td class="diff-next" class:changed={newVersion !== currentVersion}>{newVersion ?? '—'}</td>
      </tr>
    {/if}
    {#snippet TableDeltaCell(prev: number, next: number, fmt: (n: number) => string)}
      <td class="diff-next" class:changed={next !== prev}>
        {fmt(next)}<span class="diff-delta {getDeltaDirection(next, prev)}"
          >{formatDelta(next, prev, fmt)}</span
        >
      </td>
    {/snippet}
    <tr>
      <td class="diff-label">Lines</td>
      <td class="diff-current">{currentLines.toLocaleString()}</td>
      {@render TableDeltaCell(currentLines, newLines, (n) => n.toLocaleString())}
    </tr>
    <tr>
      <td class="diff-label">Size</td>
      <td class="diff-current">{bytes(currentBytes)}</td>
      {@render TableDeltaCell(currentBytes, newBytes, bytes)}
    </tr>
  </tbody>
</table>

<style>
  .diff-table {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-4) 0;

    th,
    td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
    }

    th {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    td {
      border-bottom: 1px solid var(--border-subtle, var(--border));

      &.diff-label {
        font-weight: 600;
        color: var(--fg-muted);
        width: 5rem;
      }

      &.diff-next.changed {
        font-weight: 600;
      }
    }
  }

  .diff-delta {
    font-weight: 400;
    font-size: var(--text-xs);
    color: var(--fg-muted);

    &.positive {
      color: var(--success);
    }

    &.negative {
      color: var(--danger);
    }
  }
</style>
