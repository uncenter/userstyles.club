import type { PageLoad } from './$types';
import { getProfile, getUserstyle } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  const { user, style } = params;
  const [{ value: userstyle }, profile] = await Promise.all([getUserstyle(user, style), getProfile(user)]);

  return { userstyle, profile, user, style };
};
