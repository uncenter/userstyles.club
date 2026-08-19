<script lang="ts">
  import { resolve } from '$app/paths';

  import { type ProfileView, type ListView } from '$lib/at';
  import { parseCanonicalResourceUri } from '@atcute/lexicons';

  import { BookmarkIcon } from '@lucide/svelte';

  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  interface Props {
    list: ListView;
    owner: ProfileView;
  }

  let { list, owner }: Props = $props();

  let rkey = $derived(parseCanonicalResourceUri(list.uri).rkey);
  let monogram = $derived(list.name.trim().charAt(0).toUpperCase() || '?');
</script>

<article class="list-card">
  <div class="list-card__icon grid-background" aria-hidden="true">
    <div class="list-card__monogram">{monogram}</div>
  </div>
  <div class="list-card__body">
    <h3 class="list-card__title truncate-1">
      <a
        href={resolve('/list/[user=actor]/[list=rkey]', {
          user: getPreferredActorIdentifier(owner),
          list: rkey,
        })}
      >
        {list.name}
      </a>
    </h3>
    {#if list.description}
      <p class="list-card__desc truncate-2">{list.description}</p>
    {/if}
    <footer class="list-card__meta">
      <BookmarkIcon size={12} />
      {list.itemCount}
      {list.itemCount === 1 ? 'userstyle' : 'userstyles'}
    </footer>
  </div>
</article>

<style>
  .list-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--card-bg);
    border-top: 5px solid var(--accent-cycle-color, var(--brand-purple));
    border-radius: var(--radius);

    .list-card__icon {
      height: 80px;
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      --grid-background-accent: var(--accent-cycle-color);

      .list-card__monogram {
        font-family: var(--font-display);
        font-weight: 800;
        font-size: 2.5rem;
        line-height: 1;
        color: color-mix(in srgb, var(--accent-cycle-color, var(--brand-purple)) 55%, transparent);
      }
    }

    .list-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      min-width: 0;
      flex: 1;

      .list-card__title {
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

      .list-card__desc {
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }

      .list-card__meta {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--text-xs);
        color: var(--fg-muted);
        margin-top: auto;
        padding-top: var(--space-2);
      }
    }
  }
</style>
