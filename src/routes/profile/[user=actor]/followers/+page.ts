import type { PageLoad } from './$types';
import { getProfile } from '$lib/at';
import { fetchFollowPage } from '../followList';

export const ssr = true;

export const load: PageLoad = async ({ params }) => {
  const profile = await getProfile(params.user);
  try {
    const page = await fetchFollowPage(profile.did, 'followers');
    return {
      profile,
      initial: { items: page.items, cursor: page.cursor, profiles: page.profiles },
    };
  } catch {
    return { profile };
  }
};
