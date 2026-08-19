import type { PageLoad } from './$types';
import { getProfile, listUserstyles, countFollowers, countFollows, getLists } from '$lib/at';

export const ssr = true;

export const load: PageLoad = async ({ params }) => {
  const { user } = params;
  const profile = await getProfile(user);
  const [userstyles, followerCount, followingCount, lists] = await Promise.all([
    listUserstyles(profile.did),
    countFollowers(profile.did).catch(() => undefined),
    countFollows(profile.did).catch(() => undefined),
    getLists(profile.did, { limit: 12 }).catch(() => undefined),
  ]);
  return {
    profile,
    userstyles,
    followerCount,
    followingCount,
    lists,
  };
};
