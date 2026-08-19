<script lang="ts">
  import { resolve } from '$app/paths';

  import { type ProfileView, type UserstyleView, getBlobCdnUrl, getProfile } from '$lib/at';
  import { parseCanonicalResourceUri } from '@atcute/lexicons';

  import StarRatingAverage from './StarRatingAverage.svelte';
  import ActorHandle from './ActorHandle.svelte';

  import { CalendarIcon } from '@lucide/svelte';

  import { formatDate } from '$lib/date';
  import { extractDomains } from '$lib/domains';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';
  import { getLatestDate } from '$lib/at/utils';

  const MAX_DOMAIN_BADGES = 3;

  interface Props {
    userstyle: UserstyleView;
    author: ProfileView;
  }

  let { userstyle, author }: Props = $props();

  let uri = $derived.by(() => parseCanonicalResourceUri(userstyle.uri));
  let domains = $derived(extractDomains(userstyle.mozDocumentFunctions ?? []));
  let monogram = $derived(userstyle.title.trim().charAt(0).toUpperCase() || '?');
</script>

<article class="userstyle-card">
  <div class="userstyle-card__thumbnail grid-background">
    {#if userstyle.previewImageCid}
      <img
        class="userstyle-card__thumbnail-img"
        src={getBlobCdnUrl(uri.repo, userstyle.previewImageCid, 'feed_thumbnail')}
        alt={userstyle.title}
      />
    {:else}
      <div class="userstyle-card__monogram" aria-hidden="true">{monogram}</div>
    {/if}
    {#if domains.length > 0}
      <div class="userstyle-card__thumbnail-tags">
        {#each domains.slice(0, MAX_DOMAIN_BADGES) as domain}
          <span class="userstyle-card__chip">{domain}</span>
        {/each}
        {#if domains.length > MAX_DOMAIN_BADGES}
          <span class="userstyle-card__chip-more">+{domains.length - MAX_DOMAIN_BADGES}</span>
        {/if}
      </div>
    {/if}
  </div>
  <div class="userstyle-card__body">
    <h3 class="userstyle-card__title truncate-1">
      <a
        href={resolve('/style/[user=actor]/[style=rkey]', {
          user: getPreferredActorIdentifier(author),
          style: uri.rkey,
        })}>{userstyle.title}</a
      >
    </h3>
    <ActorHandle profile={author} style="small" />
    <footer class="userstyle-card__meta">
      <span class="userstyle-card__meta-item">
        <CalendarIcon size={12} />
        {formatDate(getLatestDate(userstyle))}
      </span>
      <span class="userstyle-card__meta-item userstyle-card__meta-item--rating"
        ><StarRatingAverage average={userstyle.ratingAverage} count={userstyle.ratingCount} /></span
      >
    </footer>
  </div>
</article>

<style>
  .userstyle-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--card-bg);
    border-top: 5px solid var(--accent-cycle-color, var(--brand-purple));
    border-radius: var(--radius);

    .userstyle-card__thumbnail {
      height: 160px;
      flex-shrink: 0;
      overflow: hidden;
      position: relative;

      --grid-background-accent: var(--accent-cycle-color);

      .userstyle-card__thumbnail-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .userstyle-card__monogram {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 4.5rem;
        line-height: 1;
        color: color-mix(in srgb, var(--accent-cycle-color, var(--brand-purple)) 55%, transparent);
      }

      .userstyle-card__thumbnail-tags {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-6) var(--space-3) var(--space-2);
        overflow: hidden;
        white-space: nowrap;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);

        .userstyle-card__chip {
          display: inline-flex;
          align-items: center;
          padding: 0.1rem 0.5rem;
          font-size: var(--text-xs);
          font-weight: 700;
          border-radius: var(--radius-pill);
          white-space: nowrap;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(6px);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .userstyle-card__chip-more {
          font-size: var(--text-xs);
          color: rgba(255, 255, 255, 0.85);
          font-style: italic;
          flex-shrink: 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }
      }
    }

    .userstyle-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      min-width: 0;
      flex: 1;

      .userstyle-card__title {
        font-size: var(--text-xl);
        font-weight: 700;
        margin: 0;
        line-height: 1.2;

        a {
          color: var(--fg);

          &:not(:hover) {
            text-decoration: none;
          }
        }
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
        }
      }
    }
  }
</style>
