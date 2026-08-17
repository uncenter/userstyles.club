import type { AppBskyActorDefs } from '@atcute/bluesky';

const TYPEAHEAD_SERVICE = 'https://typeahead.waow.tech';

export type TypeaheadActor = AppBskyActorDefs.ProfileViewBasic;

export interface SearchActorsTypeaheadOptions {
  limit?: number;
  signal?: AbortSignal;
}

export async function searchActorsTypeahead(
  query: string,
  { limit = 10, signal }: SearchActorsTypeaheadOptions = {},
): Promise<TypeaheadActor[]> {
  const url = new URL('/xrpc/tech.waow.typeahead.searchActors', TYPEAHEAD_SERVICE);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Actor typeahead search failed (${response.status}).`);
  }

  const body: { actors: TypeaheadActor[] } = await response.json();
  return body.actors;
}
