import type { PageLoad } from './$types';
import { getBlobUrl, getProfile, getUserstyle } from '$lib/at';
import { ClientResponseError } from '@atcute/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  let { user, style } = params;
  try {
    let userstyle = await getUserstyle(user, style);
    let profile = await getProfile(user);

    let previewImageUrl: string | null = null;
    if (userstyle.previewImage) {
      previewImageUrl = await getBlobUrl(profile.did, userstyle.previewImage.ref.$link);
    }

    return { userstyle, profile, user, style, previewImageUrl };
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
