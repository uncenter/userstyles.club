import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { isActorIdentifier } from '@atcute/lexicons/syntax';
import { getProfile, listUserstyles } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  let { user } = params;
  let profile = await getProfile(user);
  let userstyles = await listUserstyles(profile.did);
  return { profile, userstyles };
};
