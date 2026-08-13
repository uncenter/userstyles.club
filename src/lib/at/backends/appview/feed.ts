import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { toUserstyleView } from './userstyles';
import type { UserstyleView } from '../../services/userstyles';
import type { ClubUserstylesAlphaDefs } from '@userstyles.club/atcute';

/** Same shape as the lexicon's `feedViewItem`, but `userstyle` uses our widened `UserstyleView`
 * (coerced `ratingAverage`) rather than the raw appview view. */
export type FeedViewItem = Omit<ClubUserstylesAlphaDefs.FeedViewItem, 'userstyle'> & {
  userstyle?: UserstyleView;
};

export type SearchUserstylesParams = {
  query?: string;
  sort?: 'latest' | 'popular' | 'top';
  author?: Did;
  since?: string;
  before?: string;
  homepage?: string;
  upstream?: string;
  cursor?: string;
  limit?: number;
};

export type UserstylesPage = { userstyles: UserstyleView[]; cursor?: string };

export async function searchUserstylesFromAppview(
  params: SearchUserstylesParams,
): Promise<UserstylesPage> {
  const client = getCrayonClient();
  const response = await ok(client.get('club.userstyles.alpha.feed.searchUserstyles', { params }));
  return { userstyles: response.userstyles.map(toUserstyleView), cursor: response.cursor };
}

export type FeedPage = { feed: FeedViewItem[]; cursor?: string };

export async function getTimelineFromAppview(
  opts: { actor?: Did; cursor?: string; limit?: number } = {},
): Promise<FeedPage> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.getTimeline', {
      params: { actor: opts.actor, cursor: opts.cursor, limit: opts.limit },
    }),
  );
  return {
    feed: response.feed.map(
      (item): FeedViewItem => ({
        ...item,
        userstyle: item.userstyle ? toUserstyleView(item.userstyle) : undefined,
      }),
    ),
    cursor: response.cursor,
  };
}
