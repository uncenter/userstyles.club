import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { isActorIdentifier, isRecordKey } from '@atcute/lexicons/syntax';
import { getProfile, getUserstyle } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  let { actor, rkey } = params;
  if (isActorIdentifier(actor) && isRecordKey(rkey)) {
    let userstyle = await getUserstyle(actor, rkey);
    let profile = await getProfile(actor);
    return { userstyle, profile, actor, rkey };
  }

  error(404, 'Not Found');
};
