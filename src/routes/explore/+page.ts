import type { PageLoad } from './$types';
import { searchUserstyles } from '$lib/at';

export const ssr = true;

export const load: PageLoad = async () => {
  try {
    const page = await searchUserstyles({ sort: 'latest' });
    return { initial: { items: page.userstyles, cursor: page.cursor } };
  } catch {
    return {};
  }
};
