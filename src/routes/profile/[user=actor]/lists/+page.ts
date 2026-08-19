import type { PageLoad } from './$types';
import { getProfile, getLists } from '$lib/at';

export const ssr = true;

export const load: PageLoad = async ({ params }) => {
  const profile = await getProfile(params.user);
  try {
    const page = await getLists(profile.did);
    return { profile, initial: { items: page.lists, cursor: page.cursor } };
  } catch {
    return { profile };
  }
};
