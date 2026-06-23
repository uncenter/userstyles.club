import type { PageLoad } from './$types';
import {
  getProfile,
  getUserstyle,
  getUserstyleFeedback
} from '$lib/at';
import { ClientResponseError } from '@atcute/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const { user, style } = params;
  try {
    const [userstyle, profile] = await Promise.all([getUserstyle(user, style), getProfile(user)]);

    const feedback = await getUserstyleFeedback(userstyle.uri);

    return {
      userstyle,
      profile,
      feedback,
      user,
      style,
    };
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
