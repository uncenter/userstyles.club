import type { PageLoad } from './$types';
import { listUserstyles, countFollowers, countFollows } from '$lib/at';

export const ssr = true;

export const load: PageLoad = async ({ parent }) => {
  const { profile } = await parent();
  const [userstyles, followerCount, followingCount] = await Promise.all([
    listUserstyles(profile.did),
    countFollowers(profile.did).catch(() => undefined),
    countFollows(profile.did).catch(() => undefined),
  ]);
  return {
    userstyles,
    followerCount,
    followingCount,
  };
};
