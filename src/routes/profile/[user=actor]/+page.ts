import type { PageLoad } from './$types';
import { getProfile, listUserstyles, countFollowers, countFollows } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  const { user } = params;
  const profile = await getProfile(user);
  const [userstyles, followerCount, followingCount] = await Promise.all([
    listUserstyles(profile.did),
    countFollowers(profile.did).catch(() => undefined),
    countFollows(profile.did).catch(() => undefined),
  ]);
  return {
    profile,
    userstyles,
    followerCount,
    followingCount,
  };
};
