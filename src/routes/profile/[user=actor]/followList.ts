import type { Did } from '@atcute/lexicons';
import {
  listFollows,
  listFollowers,
  getProfiles,
  type FollowView,
  type ProfileView,
} from '$lib/at';

export type FollowListKind = 'followers' | 'following';

export interface FollowPage {
  items: FollowView[];
  cursor?: string;
  profiles: Map<Did, ProfileView>;
}

export async function fetchFollowPage(
  actor: Did,
  kind: FollowListKind,
  cursor?: string,
): Promise<FollowPage> {
  const page =
    kind === 'followers'
      ? await listFollowers(actor, { cursor })
      : await listFollows(actor, { cursor });
  const profiles = await getProfiles(page.follows.map((f) => f.did));
  return { items: page.follows, cursor: page.cursor, profiles };
}
