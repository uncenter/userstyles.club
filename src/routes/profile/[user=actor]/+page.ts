import type { PageLoad } from './$types';
import { getProfile, listUserstyles } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  const { user } = params;
  const profile = await getProfile(user);
  const userstyles = await listUserstyles(profile.did);
  return { profile, userstyles };
};
