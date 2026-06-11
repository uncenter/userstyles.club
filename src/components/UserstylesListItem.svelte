<script lang="ts">
  import { resolve } from '$app/paths';

  import {
    type ProfileView,
    type UserstyleRecord,
    getBlobCdnUrl,
    getProfile,
    listReviewsForStyle,
    computeAverageRating
  } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';
  import type { Did } from '@atcute/lexicons';

  import StarRating from './StarRating.svelte';
  import ActorHandle from './ActorHandle.svelte';

  import { CalendarIcon, WeightIcon } from '@lucide/svelte';

  import bytes from 'pretty-bytes';
  import { formatDate } from '$lib/date';

  interface Props {
    userstyle: UserstyleRecord;
    author?: ProfileView;
  }

  let { userstyle, author }: Props = $props();

  let uri = $derived.by(() => parseResourceUri(userstyle.uri));
  let profile = $derived(author || (await getProfile(uri.repo)));
</script>

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
    <div class="card-title-row">
      <h3 class="userstyle-title">
        <a href={resolve('/style/[user=actor]/[style=rkey]', { user: uri.repo, style: uri.rkey! })}
          >{userstyle.value.title}</a
        >
      </h3>
      <ActorHandle {profile} minimal={true} />
    </div>
    <p class="userstyle-description">{userstyle.value.description ?? ''}</p>
    <footer class="card-meta">
      <span class="meta-item">
        <CalendarIcon size={12} />
        {formatDate(userstyle.value.updatedAt ?? userstyle.value.createdAt)}
      </span>
      <span class="meta-item">
        <WeightIcon size={12} />
        {bytes(userstyle.value.sourceCode.length)}
      </span>
      {#await listReviewsForStyle(userstyle.uri) then reviews}
        {@const avg = computeAverageRating(reviews)}
        {#if avg}
          <span class="meta-item meta-item-rating"
            ><StarRating rating={avg.average} count={avg.count} /></span
          >
        {:else}
          <span class="meta-item meta-item-rating meta-na">Unrated</span>
        {/if}
      {/await}
    </footer>
  </div>
</article>

<style>
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

      .card-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        min-width: 0;

        :global .actor-handle {
          padding: 0;
          flex-shrink: 0;
        }
      }

      .userstyle-title {
        font-size: var(--text-xl);
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;

        a:not(:hover) {
          text-decoration: none;
        }
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

      .card-meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--text-xs);
        color: var(--fg-muted);
        flex-wrap: wrap;
        margin-top: var(--space-1);

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .meta-item-rating {
          margin-left: auto;
        }

        .meta-na {
          font-style: italic;
        }
      }
    }
  }
</style>
