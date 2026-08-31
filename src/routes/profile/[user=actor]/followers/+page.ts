import type { PageLoad } from './$types';
import { fetchFollowPage } from '../followList';

export const ssr = true;

export const load: PageLoad = async ({ parent }) => {
  const { profile } = await parent();
  try {
    const page = await fetchFollowPage(profile.did, 'followers');
    return {
      initial: { items: page.items, cursor: page.cursor, profiles: page.profiles },
    };
  } catch {
    return {};
  }
};
