import type { PageLoad } from './$types';
import {
  getProfile,
  getUserstyle,
  listReviewsForStyle,
  type ReviewRecord,
  type ProfileView
} from '$lib/at';
import { parseResourceUri } from '@atcute/lexicons';
import { ClientResponseError } from '@atcute/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const { user, style } = params;
  try {
    const [userstyle, profile] = await Promise.all([getUserstyle(user, style), getProfile(user)]);

    let reviews: ReviewRecord[] = await listReviewsForStyle(userstyle.uri);

    const reviewers: Record<string, ProfileView> = {};
    await Promise.all(
      [...new Set(reviews.map((r) => parseResourceUri(r.uri).repo))].map(async (did) => {
        reviewers[did] = await getProfile(did);
      })
    );

    return {
      userstyle,
      profile,
      reviews,
      reviewers,
      user,
      style
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
