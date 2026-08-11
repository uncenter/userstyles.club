<script lang="ts">
  import { resolve } from '$app/paths';

  import { type ProfileView, type UserstyleView, getBlobCdnUrl, getProfile } from '$lib/at';
  import { parseCanonicalResourceUri } from '@atcute/lexicons';

  import StarRatingAverage from './StarRatingAverage.svelte';
  import ActorHandle from './ActorHandle.svelte';
  import { Badge } from './ui';

  import { CalendarIcon, SlidersHorizontalIcon } from '@lucide/svelte';

  import { formatDate } from '$lib/date';
  import { extractDomains } from '$lib/domains';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  const MAX_DOMAIN_BADGES = 3;

  interface Props {
    userstyle: UserstyleView;
    author: ProfileView;
  }

  let { userstyle, author }: Props = $props();

  let uri = $derived.by(() => parseCanonicalResourceUri(userstyle.uri));
  let domains = $derived(extractDomains(userstyle.mozDocumentFunctions ?? []));
  let userCssVarsLabel = $derived(
    userstyle.userCssVars && userstyle.userCssVars > 0
      ? userstyle.userCssVars > 9
        ? '9+'
        : String(userstyle.userCssVars)
      : undefined,
  );
</script>

<article class="userstyle-card">
  <div class="userstyle-card__thumbnail grid-background">
    {#if userstyle.previewImageCid}
      <img
        class="userstyle-card__thumbnail-img"
        src={getBlobCdnUrl(uri.repo, userstyle.previewImageCid, 'feed_thumbnail')}
        alt={userstyle.title}
      />
    {/if}
  </div>
  <div class="userstyle-card__body">
    <div class="userstyle-card__title-row">
      <h3 class="userstyle-card__title truncate-1">
        <a
          href={resolve('/style/[user=actor]/[style=rkey]', {
            user: getPreferredActorIdentifier(author),
            style: uri.rkey,
          })}>{userstyle.title}</a
        >
      </h3>
      <ActorHandle profile={author} style="minimal" />
    </div>
    <p class="userstyle-card__description truncate-1">{userstyle.description ?? ''}</p>
    {#if domains.length > 0}
      <div class="userstyle-card__tags">
        {#each domains.slice(0, MAX_DOMAIN_BADGES) as domain}
          <Badge>{domain}</Badge>
        {/each}
        {#if domains.length > MAX_DOMAIN_BADGES}
          <span class="userstyle-card__more">and {domains.length - MAX_DOMAIN_BADGES} more</span>
        {/if}
      </div>
    {/if}
    <footer class="userstyle-card__meta">
      <span class="userstyle-card__meta-item">
        <CalendarIcon size={12} />
        {formatDate(userstyle.updatedAt ?? userstyle.createdAt)}
      </span>
      {#if userCssVarsLabel}
        <span
          class="userstyle-card__meta-item"
          title="{userstyle.userCssVars} configurable option{userstyle.userCssVars === 1
            ? ''
            : 's'}"
        >
          <SlidersHorizontalIcon size={12} />
          {userCssVarsLabel}
        </span>
      {/if}
      {#if userstyle.ratingAverage !== undefined}
        <span class="userstyle-card__meta-item userstyle-card__meta-item--rating"
          ><StarRatingAverage
            average={userstyle.ratingAverage}
            count={userstyle.ratingCount}
          /></span
        >
      {:else}
        <span
          class="userstyle-card__meta-item userstyle-card__meta-item--rating userstyle-card__meta-item--na"
          >Unrated</span
        >
      {/if}
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

      --grid-background-accent: var(--accent-cycle-color);

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

        a {
          color: var(--fg);

          &:not(:hover) {
            text-decoration: none;
          }
        }
      }

      .userstyle-card__description {
        font-size: var(--text-sm);
        color: var(--fg-muted);
        line-height: 1.4;
        min-height: 1.4em;
        margin: 0;
      }

      .userstyle-card__tags {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .userstyle-card__more {
        font-size: var(--text-xs);
        color: var(--fg-muted);
        font-style: italic;
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
