import type { PageLoad } from './$types';
import { getProfile, getUserstyle } from '$lib/at';
import { ClientResponseError } from '@atcute/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  let { user, style } = params;
  try {
    let userstyle = await getUserstyle(user, style);
    let profile = await getProfile(user);
    return { userstyle, profile, user, style };
  } catch (e) {
    if (e instanceof ClientResponseError) {
      switch (e.error) {
        case 'RecordNotFound':
          error(404, e.message);
        default:
          error(500, e.message);
      }
    } else {
      throw e;
    }
  }
};
