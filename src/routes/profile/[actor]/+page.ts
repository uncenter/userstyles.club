import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { isActorIdentifier } from '@atcute/lexicons/syntax';
import { getProfile, listUserstyles } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  let { actor } = params;
  if (isActorIdentifier(actor)) {
    let profile = await getProfile(actor);
    let userstyles = await listUserstyles(profile.did);
    return { profile, userstyles };
  }

  error(404, 'Not Found');
};
