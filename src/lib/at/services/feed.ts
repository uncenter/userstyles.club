import type { Did } from '@atcute/lexicons';

import {
  searchUserstylesFromAppview,
  getTimelineFromAppview,
  type SearchUserstylesParams,
  type UserstylesPage,
  type FeedViewItem,
  type FeedPage,
} from '../backends/appview/feed';
import { isAppviewEnabled } from '../settings';

export type { SearchUserstylesParams, UserstylesPage, FeedViewItem, FeedPage };

export async function searchUserstyles(params: SearchUserstylesParams): Promise<UserstylesPage> {
  if (!isAppviewEnabled()) throw new Error('Search requires the appview to be enabled.');
  return await searchUserstylesFromAppview(params);
}

export function authorOfFeedItem(item: FeedViewItem): Did | undefined {
  return item.comment?.author ?? item.rating?.author ?? item.follow?.did ?? item.userstyle?.author;
}

export function subjectOfFeedItem(item: FeedViewItem): Did | undefined {
  return item.follow?.subjectDid;
}

export async function getTimeline(opts?: {
  actor?: Did;
  cursor?: string;
  limit?: number;
}): Promise<FeedPage> {
  if (!isAppviewEnabled()) throw new Error('The activity feed requires the appview to be enabled.');
  return await getTimelineFromAppview(opts);
}
