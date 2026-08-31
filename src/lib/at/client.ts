import { Client, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import type {} from '@atcute/microcosm';
import { LRUCache } from 'lru-cache';
import { getConstellationUrl, getCrayonUrl, getSlingshotUrl } from './settings';

export interface ResolvedActor {
  did: Did;
  handle: Handle | undefined;
  pds: string;
}

const INVALID_HANDLE = 'handle.invalid';

const POSITIVE_TTL = 24 * 60 * 60_000;
const NEGATIVE_TTL = 60_000;
const MAX_CACHE_ENTRIES = 100;

const UNRESOLVABLE = Symbol('unresolvable');

const actors = new LRUCache<ActorIdentifier, ResolvedActor | typeof UNRESOLVABLE>({
  max: MAX_CACHE_ENTRIES,
});
const pending = new Map<ActorIdentifier, Promise<ResolvedActor | undefined>>();

/** Resolves a handle or DID to its identity (DID, verified handle, PDS) via Slingshot, cached in-memory with a TTL. */
export async function resolveActor(actor: ActorIdentifier): Promise<ResolvedActor | undefined> {
  const cached = actors.get(actor);
  if (cached !== undefined) return cached === UNRESOLVABLE ? undefined : cached;

  const inFlight = pending.get(actor);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const response = await getSlingshotClient().get('blue.microcosm.identity.resolveMiniDoc', {
        params: { identifier: actor },
      });
      if (!response.ok) {
        actors.set(actor, UNRESOLVABLE, { ttl: NEGATIVE_TTL });
        return undefined;
      }

      const resolved: ResolvedActor = {
        did: response.data.did,
        handle: response.data.handle === INVALID_HANDLE ? undefined : response.data.handle,
        pds: response.data.pds,
      };
      actors.set(actor, resolved, { ttl: POSITIVE_TTL });
      if (resolved.did !== actor) actors.set(resolved.did, resolved, { ttl: POSITIVE_TTL });
      return resolved;
    } finally {
      pending.delete(actor);
    }
  })();
  pending.set(actor, promise);
  return promise;
}

export function getPublicClient(): Client {
  return new Client({ handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }) });
}

export function getRelayClient(): Client {
  return new Client({
    handler: simpleFetchHandler({ service: 'https://relay1.us-east.bsky.network' }),
  });
}

export function getConstellationClient(): Client {
  return new Client({ handler: simpleFetchHandler({ service: getConstellationUrl() }) });
}

export function getSlingshotClient(): Client {
  return new Client({ handler: simpleFetchHandler({ service: getSlingshotUrl() }) });
}

export function getCrayonClient(): Client {
  return new Client({ handler: simpleFetchHandler({ service: getCrayonUrl() }) });
}

export async function getPdsClient(actor: ActorIdentifier): Promise<Client> {
  const resolved = await resolveActor(actor);
  if (!resolved) throw new Error(`could not resolve identity for ${actor}`);

  return new Client({ handler: simpleFetchHandler({ service: resolved.pds }) });
}
