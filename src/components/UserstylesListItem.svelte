<script lang="ts">
  import { resolve } from '$app/paths';

  import { type ProfileView, type UserstyleRecord, getBlobCdnUrl, getProfile } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';
  import type { Did } from '@atcute/lexicons';

  import { Badge } from '$components/ui';

  import { CakeIcon, PenLineIcon, RulerDimensionLineIcon, WeightIcon } from '@lucide/svelte';

  import ActorHandle from './ActorHandle.svelte';

  import bytes from 'pretty-bytes';
  import { formatDate } from '$lib/date';

  interface Props {
    userstyle: UserstyleRecord;
    author?: ProfileView;
  }

  let { userstyle, author }: Props = $props();

  let uri = $derived.by(() => parseResourceUri(userstyle.uri));
  let profile = $derived(author || await getProfile(uri.repo));
</script>

<a
  class="userstyle-card-wrapper"
  href={resolve('/style/[user=actor]/[style=rkey]', { user: uri.repo, style: uri.rkey! })}
>
  <article class="userstyle-card">
    <div class="card-thumbnail">
      {#if userstyle.value.previewImage}
        <img
          src={getBlobCdnUrl(
            uri.repo as Did,
            userstyle.value.previewImage.ref.$link,
            'feed_thumbnail'
          )}
          alt={userstyle.value.title}
        />
      {/if}
    </div>
    <div class="card-body">
      <h3 class="userstyle-title">{userstyle.value.title}</h3>
      <ActorHandle {profile} />
      <p class="userstyle-description">{userstyle.value.description ?? ''}</p>
      <footer class="userstyle-card-footer">
        <Badge variant="secondary"
          ><CakeIcon size={16} /> {formatDate(userstyle.value.createdAt)}</Badge
        >
        <Badge variant="secondary"
          ><PenLineIcon size={16} />
          {userstyle.value.updatedAt ? formatDate(userstyle.value.updatedAt) : '—'}</Badge
        >
        <Badge variant="secondary"
          ><RulerDimensionLineIcon size={16} />
          {userstyle.value.sourceCode.split('\n').length} lines</Badge
        >
        <Badge variant="secondary"
          ><WeightIcon size={16} /> {bytes(userstyle.value.sourceCode.length)}</Badge
        >
      </footer>
    </div>
  </article>
</a>

<style>
  .userstyle-card-wrapper {
    text-decoration: none;
  }

  .userstyle-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--card-bg);
    border: 2px solid var(--border);
    transition:
      transform var(--ease-fast),
      box-shadow var(--ease-fast),
      border-color var(--ease-fast);

    &:hover {
      transform: translate(-2px, -2px);
      border-color: var(--card-hover-color, var(--accent));
      box-shadow: 6px 7px 0 var(--card-hover-color, var(--accent));
    }

    .card-thumbnail {
      height: 160px;
      flex-shrink: 0;
      overflow: hidden;
      background: var(--bg-faint);

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      min-width: 0;
    }

    .userstyle-title {
      font-size: var(--text-xl);
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .userstyle-description {
      font-size: var(--text-sm);
      color: var(--fg-muted);
      line-height: 1.4;
      min-height: 1.4em;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .userstyle-card-footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);

      :global(.badge) {
        min-width: 0;
        width: 100%;
        justify-content: flex-start;
      }

      :global(.badge .lucide-icon) {
        margin-right: 0.5rem;
        flex-shrink: 0;
      }
    }
  }
</style>
