import type { PageLoad } from './$types';
import {
  getProfile,
  getUserstyle,
  getUserstyleFeedback
} from '$lib/at';
import { XrpcResponseError } from '@atproto/lex';
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
  } catch (err) {
    if (err instanceof XrpcResponseError && err.error === 'RecordNotFound') {
      error(404, err.message);
    } else {
      throw err;
    }
  }
};
