import type { PageLoad } from './$types';
import {
  getTimeline,
  getProfiles,
  authorOfFeedItem,
  subjectOfFeedItem,
  type FeedViewItem,
  type ProfileView,
} from '$lib/at';
import type { Did } from '@atcute/lexicons';

export const ssr = true;

type InitialFeed = { items: FeedViewItem[]; cursor?: string; profiles: Map<Did, ProfileView> };

export const load: PageLoad = async ({ parent }) => {
  const { sessionDid } = await parent();
  if (!sessionDid) return { initial: undefined as InitialFeed | undefined };

  try {
    const page = await getTimeline({ actor: sessionDid });
    const dids = [
      ...new Set(
        page.feed
          .flatMap((item) => [authorOfFeedItem(item), subjectOfFeedItem(item)])
          .filter((did): did is Did => !!did),
      ),
    ];
    const profiles = await getProfiles(dids);
    return { initial: { items: page.feed, cursor: page.cursor, profiles } as InitialFeed };
  } catch {
    return { initial: undefined as InitialFeed | undefined };
  }
};
