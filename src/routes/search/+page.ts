import type { PageLoad } from './$types';
import { searchUserstyles } from '$lib/at';

const SORTS = ['latest', 'popular', 'top'] as const;
type Sort = (typeof SORTS)[number];

function parseSort(value: string | null): Sort {
  return (SORTS as readonly string[]).includes(value ?? '') ? (value as Sort) : 'latest';
}

export const ssr = true;
export const prerender = false;

export const load: PageLoad = async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';
  const sort = parseSort(url.searchParams.get('sort'));

  try {
    const page = await searchUserstyles({ query: query.trim() || undefined, sort });
    return { query, sort, initial: { items: page.userstyles, cursor: page.cursor } };
  } catch {
    return { query, sort };
  }
};
