<script lang="ts">
  import { resolve } from '$app/paths';
  import { parseResourceUri } from '@atcute/lexicons/syntax';

  import {
    type UserstyleRecord,
    type ProfileView,
    type CommentRecord,
    type RatingRecord,
    user,
    listMyUserstyles,
    listCommentsForStyle,
    listRatingsForStyle,
    listRecordsForRepo,
    getUserstyle,
    getProfile,
    CLUB_COMMENT_COLLECTION,
    CLUB_RATING_COLLECTION,
  } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';
  import { formatDateTime, formatDateTimeRelative } from '$lib/date';

  import { ActorHandle, StarRating } from '$components';
  import { Alert, Spinner } from '$components/ui';

  import { ClockIcon, ActivityIcon } from '@lucide/svelte';

  type ActivityEvent =
    | { kind: 'comment'; date: string; style: UserstyleRecord; profile: ProfileView; record: CommentRecord }
    | { kind: 'rating'; date: string; style: UserstyleRecord; profile: ProfileView; record: RatingRecord };

  type ResolvedStyle = { style: UserstyleRecord; profile: ProfileView };

  function byDateDesc(a: { date: string }, b: { date: string }) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }

  // Resolves each record to an ActivityEvent.
  async function toEvents<T extends CommentRecord | RatingRecord>(
    records: T[],
    kind: ActivityEvent['kind'],
    resolve: (record: T) => Promise<ResolvedStyle | undefined>,
  ): Promise<ActivityEvent[]> {
    const events = await Promise.all(
      records.map(async (record) => {
        const resolved = await resolve(record);
        if (!resolved) return undefined;
        return {
          kind,
          record,
          date: record.value.updatedAt ?? record.value.createdAt,
          ...resolved,
        } as ActivityEvent;
      }),
    );
    return events.filter((event): event is ActivityEvent => event !== undefined);
  }

  function isFromOther(record: CommentRecord | RatingRecord) {
    return parseResourceUri(record.uri).repo !== user.did;
  }

  const userstyles = listMyUserstyles();

  async function loadReceivedActivity(): Promise<ActivityEvent[]> {
    const styles = await userstyles;

    const resolveCommenter = (style: UserstyleRecord) => async (record: CommentRecord | RatingRecord) => ({
      style,
      profile: await getProfile(parseResourceUri(record.uri).repo),
    });

    const events = await Promise.all(
      styles.flatMap((style) => [
        listCommentsForStyle(style.uri).then((records) =>
          toEvents(records.filter(isFromOther), 'comment', resolveCommenter(style)),
        ),
        listRatingsForStyle(style.uri).then((records) =>
          toEvents(records.filter(isFromOther), 'rating', resolveCommenter(style)),
        ),
      ]),
    );

    return events.flat().sort(byDateDesc);
  }

  const receivedActivity = loadReceivedActivity();

  async function resolveOtherUsersStyle(subjectUri: string): Promise<ResolvedStyle | undefined> {
    const { repo, rkey } = parseResourceUri(subjectUri);
    if (repo === user.did || !rkey) return undefined; // skip the user's own styles
    try {
      const [style, profile] = await Promise.all([getUserstyle(repo, rkey), getProfile(repo)]);
      return { style, profile };
    } catch {
      return undefined; // the referenced style or its author may no longer exist
    }
  }

  async function loadGivenActivity(): Promise<ActivityEvent[]> {
    const [comments, ratings] = await Promise.all([
      listRecordsForRepo({ repo: user.did!, collection: CLUB_COMMENT_COLLECTION }).then(
        ({ records }) => records,
      ),
      listRecordsForRepo({ repo: user.did!, collection: CLUB_RATING_COLLECTION }).then(
        ({ records }) => records,
      ),
    ]);

    const [commentEvents, ratingEvents] = await Promise.all([
      toEvents(comments, 'comment', (record) => resolveOtherUsersStyle(record.value.subject)),
      toEvents(ratings, 'rating', (record) => resolveOtherUsersStyle(record.value.subject)),
    ]);

    return [...commentEvents, ...ratingEvents].sort(byDateDesc);
  }

  const givenActivity = loadGivenActivity();

  type StyleShortcut = { style: UserstyleRecord; profile: ProfileView; date: string };

  async function loadRecentStyles(): Promise<StyleShortcut[]> {
    const [ownStyles, given] = await Promise.all([userstyles, givenActivity]);

    const own: StyleShortcut[] = ownStyles.map((style) => ({
      style,
      profile: user.profile!,
      date: style.value.updatedAt ?? style.value.createdAt,
    }));

    const others = new Map<string, StyleShortcut>();
    for (const event of given) {
      // `given` is already sorted by date descending, so the first event seen per style is the most recent.
      if (!others.has(event.style.uri)) {
        others.set(event.style.uri, { style: event.style, profile: event.profile, date: event.date });
      }
    }

    return [...own, ...others.values()].sort(byDateDesc);
  }

  const recentStyles = loadRecentStyles();

  function getLinkToStyle(styleUri: string, profile: ProfileView) {
    const { rkey } = parseResourceUri(styleUri);
    return resolve('/style/[user=actor]/[style=rkey]', {
      user: getPreferredActorIdentifier(profile),
      style: rkey!,
    });
  }

  function getLinkToUserOwnStyle(styleUri: string) {
    return getLinkToStyle(styleUri, user.profile!);
  }
</script>

{#snippet loading()}
  <div class="inline-loading"><Spinner size="md" /> Loading…</div>
{/snippet}

<div class="dashboard-layout">
  <aside class="dashboard-sidebar">
    <div class="dashboard-sidebar__section">
      <h2 class="section-heading"><ClockIcon size={16} /> Recents</h2>
      {#await recentStyles}
        {@render loading()}
      {:then recentStyles}
        {#if recentStyles.length === 0}
          <p class="text-muted no-content">
            No recent activity yet.
          </p>
        {:else}
          {@const recents = recentStyles.slice(0, 6)}
          <ul class="style-list list-reset accent-cycle" role="list">
            {#each recents as { style, profile } (style.uri)}
              <li class="style-list__item">
                <a href={getLinkToStyle(style.uri, profile)} class="style-shortcut">
                  <span class="style-shortcut__dot"></span>
                  <span class="style-shortcut__title truncate-1">{style.value.title}</span>
                  <span class="style-shortcut__author">@{profile.handle}</span>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      {:catch error}
        <Alert variant="error">{error}</Alert>
      {/await}
    </div>
  </aside>

  <div class="dashboard-main">
    <h2 class="section-heading"><ActivityIcon size={16} /> Timeline</h2>
    {#await receivedActivity}
      {@render loading()}
    {:then receivedActivity}
      {#if receivedActivity.length === 0}
        <p class="text-muted no-content">No interactions on your userstyles yet.</p>
      {:else}
        {@const recents = receivedActivity.slice(0, 5)}
        <ul class="activity-list list-reset" role="list">
          {#each recents as event (event.record.uri)}
            <li class="activity-list__item">
              <div class="activity-list__item-header">
                <ActorHandle profile={event.profile} style="small" />
                <span class="activity-list__item-on"
                  >{event.kind === 'comment' ? 'commented on' : 'rated'}
                  <a
                    href={getLinkToUserOwnStyle(event.style.uri)}
                    class="link link--quiet activity-list__style-link">{event.style.value.title}</a
                  ></span
                >
                <div class="activity-list__item-end">
                  <time
                    class="activity-list__date"
                    datetime={event.date}
                    title={formatDateTime(event.date)}>{formatDateTimeRelative(event.date)}</time
                  >
                </div>
              </div>
              {#if event.kind === 'comment'}
                <p class="activity-list__content truncate-2">{event.record.value.comment}</p>
              {:else}
                <div class="activity-list__content">
                  <StarRating value={event.record.value.rating} />
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    {:catch error}
      <Alert variant="error">{error}</Alert>
    {/await}
  </div>
</div>

<style>
  .dashboard-layout {
    display: flex;
    gap: var(--space-6);
    align-items: flex-start;
    flex-wrap: wrap;

    .dashboard-sidebar {
      flex: 1 1 0;
      min-width: 16rem;
      display: flex;
      flex-direction: column;
    }

    .dashboard-main {
      flex: 2 1 0;
      min-width: 20rem;
    }
  }

  .style-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .style-shortcut {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--space-3);
    row-gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    background: var(--card-bg);
    border-radius: var(--radius);
    text-decoration: none;
    color: var(--foreground);
    transition: opacity var(--ease-fast);

    &:hover {
      opacity: 0.85;
    }

    .style-shortcut__dot {
      width: 0.55rem;
      height: 0.55rem;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--accent-cycle-color, var(--brand-purple));
    }

    .style-shortcut__title {
      font-weight: 700;
      flex: 1 1 auto;
      min-width: 8rem;
    }

    .style-shortcut__author {
      font-size: var(--text-sm);
      color: var(--fg-muted);
      flex-shrink: 0;
    }
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xl);
    font-weight: 700;
    margin-bottom: var(--space-4);
  }

  .no-content {
    padding: var(--space-2) 0;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .activity-list__item {
      padding: var(--space-4);
      background: var(--card-bg);
      border-radius: var(--radius);

      .activity-list__item-header {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        flex-wrap: wrap;
        margin-bottom: var(--space-2);

        .activity-list__item-on {
          color: var(--fg-muted);
        }

        .activity-list__style-link {
          font-weight: 600;
        }

        .activity-list__item-end {
          margin-left: auto;
          display: flex;
          flex-direction: row;
          gap: var(--space-2);
        }

        .activity-list__date {
          font-size: var(--text-sm);
          color: var(--fg-muted);
        }
      }

      .activity-list__content {
        line-height: 1.5;
      }
    }
  }
</style>
