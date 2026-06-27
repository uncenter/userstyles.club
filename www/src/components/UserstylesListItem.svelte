<script lang="ts">
  import { resolve } from '$app/paths';

  import {
    type ProfileView,
    type UserstyleRecord,
    getBlobCdnUrl,
    getProfile,
    listRatingsForStyle,
    computeAverageRating,
  } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';
  import type { Did } from '@atcute/lexicons';

  import StarRatingAverage from './StarRatingAverage.svelte';
  import ActorHandle from './ActorHandle.svelte';

  import { CalendarIcon } from '@lucide/svelte';

  import { formatDate } from '$lib/date';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  interface Props {
    userstyle: UserstyleRecord;
    author?: ProfileView;
  }

  let { userstyle, author }: Props = $props();

  let uri = $derived.by(() => parseResourceUri(userstyle.uri));
  let profile = $derived(author || (await getProfile(uri.repo)));
</script>

<article class="userstyle-card">
  <div class="userstyle-card__thumbnail grid-background">
    {#if userstyle.value.previewImage}
      <img
        class="userstyle-card__thumbnail-img"
        src={getBlobCdnUrl(
          uri.repo as Did,
          userstyle.value.previewImage.ref.$link,
          'feed_thumbnail',
        )}
        alt={userstyle.value.title}
      />
    {/if}
  </div>
  <div class="userstyle-card__body">
    <div class="userstyle-card__title-row">
      <h3 class="userstyle-card__title">
        <a
          href={resolve('/style/[user=actor]/[style=rkey]', {
            user: getPreferredActorIdentifier(profile),
            style: uri.rkey!,
          })}>{userstyle.value.title}</a
        >
      </h3>
      <ActorHandle {profile} style='minimal' />
    </div>
    <p class="userstyle-card__description">{userstyle.value.description ?? ''}</p>
    <footer class="userstyle-card__meta">
      <span class="userstyle-card__meta-item">
        <CalendarIcon size={12} />
        {formatDate(userstyle.value.updatedAt ?? userstyle.value.createdAt)}
      </span>
      {#await listRatingsForStyle(userstyle.uri) then ratings}
        {@const computed = computeAverageRating(ratings)}
        {#if computed}
          <span class="userstyle-card__meta-item userstyle-card__meta-item--rating"><StarRatingAverage average={computed.average} count={computed.count} /></span
          >
        {:else}
          <span class="userstyle-card__meta-item userstyle-card__meta-item--rating userstyle-card__meta-item--na">Unrated</span>
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
    border-top: 5px solid var(--card-accent-color, var(--brand-purple));
    border-radius: var(--radius);

    .userstyle-card__thumbnail {
      height: 160px;
      flex-shrink: 0;
      overflow: hidden;

      --grid-background-accent: var(--card-accent-color);

      .userstyle-card__thumbnail-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .userstyle-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      min-width: 0;
      flex: 1;

      .userstyle-card__title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        min-width: 0;
      }

      .userstyle-card__title {
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

      .userstyle-card__description {
        font-size: var(--text-sm);
        color: var(--fg-muted);
        line-height: 1.4;
        min-height: 1.4em;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .userstyle-card__meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--text-xs);
        color: var(--fg-muted);
        flex-wrap: wrap;
        margin-top: auto;
        padding-top: var(--space-2);

        .userstyle-card__meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;

          &.userstyle-card__meta-item--rating {
            margin-left: auto;
          }

          &.userstyle-card__meta-item--na {
            font-style: italic;
          }
        }
      }
    }
  }
</style>
