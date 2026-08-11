import type { PageLoad } from './$types';
import { getProfile } from '$lib/at';

export const load: PageLoad = async ({ params }) => {
  const profile = await getProfile(params.user);
  return { profile };
};
