import type { PageLoad } from './$types';
import { getProfile, getList } from '$lib/at';
import { ClientResponseError } from '@atcute/client';
import { error } from '@sveltejs/kit';

export const ssr = true;

export const load: PageLoad = async ({ params }) => {
  const { user, list } = params;
  try {
    const [profile, page] = await Promise.all([getProfile(user), getList(user, list)]);
    return {
      profile,
      list: page.list,
      initial: { items: page.items, cursor: page.cursor },
    };
  } catch (e) {
    if (e instanceof ClientResponseError && e.error === 'ListNotFound') {
      error(404, e.message);
    }
    throw e;
  }
};
