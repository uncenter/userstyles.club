import type { PageLoad } from './$types';
import { getProfile, getUserstyle } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  const { user, style } = params;
  const userstyle = await getUserstyle(user, style);
  const profile = await getProfile(user);
  return { userstyle, profile, user, style };
};
