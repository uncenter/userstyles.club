import type { PageLoad } from './$types';
import { getBlobUrl, getProfile, getUserstyle } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  const { user, style } = params;
  const [userstyle, profile] = await Promise.all([getUserstyle(user, style), getProfile(user)]);

  let previewImageUrl: string | null = null;
  if (userstyle.previewImage) {
    previewImageUrl = await getBlobUrl(profile.did, userstyle.previewImage.ref.$link);
  }

  return { userstyle, profile, user, style, previewImageUrl };
};
