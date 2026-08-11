import type { LayoutLoad } from './$types';
import { getProfile, getUserstyle } from '$lib/at';
import { ClientResponseError } from '@atcute/client';
import { error } from '@sveltejs/kit';

export const load: LayoutLoad = async ({ params }) => {
  const { user, style } = params;
  try {
    const [userstyle, profile] = await Promise.all([getUserstyle(user, style), getProfile(user)]);
    return { userstyle, profile, user, style };
  } catch (e) {
    // 'RecordNotFound' comes from a direct pds fetch, 'UserstyleNotFound' from the crayon appview.
    if (e instanceof ClientResponseError && (e.error === 'RecordNotFound' || e.error === 'UserstyleNotFound')) {
      error(404, e.message);
    } else {
      throw e;
    }
  }
};
