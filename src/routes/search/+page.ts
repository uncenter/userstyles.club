import type { PageLoad } from './$types';

const SORTS = ['latest', 'popular', 'top'] as const;
type Sort = (typeof SORTS)[number];

function parseSort(value: string | null): Sort {
  return (SORTS as readonly string[]).includes(value ?? '') ? (value as Sort) : 'latest';
}

export const load: PageLoad = ({ url }) => {
  return {
    query: url.searchParams.get('q') ?? '',
    sort: parseSort(url.searchParams.get('sort')),
  };
};
