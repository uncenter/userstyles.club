import type { PageLoad } from './$types';
import { getProfile, getUserstyle } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  let { user, style } = params;
  let userstyle = await getUserstyle(user, style);
  let profile = await getProfile(user);
  return { userstyle, profile, user, style };
};
