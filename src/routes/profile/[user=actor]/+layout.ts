import type { LayoutLoad } from './$types';
import { getProfile } from '$lib/at';

export const ssr = true;

export const load: LayoutLoad = async ({ params }) => {
  const profile = await getProfile(params.user);
  return { profile };
};
