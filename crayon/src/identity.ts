import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import { Client, simpleFetchHandler } from '@atcute/client';
import type {} from '@atcute/microcosm';
import { LRUCache } from 'lru-cache';

const SLINGSHOT_URL = process.env.SLINGSHOT_URL ?? 'https://slingshot.microcosm.blue';
const slingshot = new Client({ handler: simpleFetchHandler({ service: SLINGSHOT_URL }) });

const POSITIVE_TTL = 24 * 60 * 60_000;
const NEGATIVE_TTL = 60_000;
const MAX_CACHE_ENTRIES = 1_000;

export interface ResolvedIdentity {
  did: Did;
  handle: Handle;
  pds: string;
}

const UNRESOLVABLE = Symbol('unresolvable');

const actors = new LRUCache<string, ResolvedIdentity | typeof UNRESOLVABLE>({
  max: MAX_CACHE_ENTRIES,
});
const pending = new Map<string, Promise<ResolvedIdentity | undefined>>();

async function resolveMiniDoc(identifier: string): Promise<ResolvedIdentity | undefined> {
  try {
    const response = await slingshot.get('blue.microcosm.identity.resolveMiniDoc', {
      params: { identifier: identifier as ActorIdentifier },
    });
    if (!response.ok) return undefined;
    return response.data;
  } catch (err) {
    console.warn(`slingshot identity resolution failed for ${identifier}`, err);
    return undefined;
  }
}

/** Resolve a handle or DID to its identity (DID, handle, PDS) via the in-memory cache or Slingshot.
 * An unresolvable identifier returns undefined without throwing.
 * */
export async function resolveActor(identifier: string): Promise<ResolvedIdentity | undefined> {
  const cached = actors.get(identifier);
  if (cached !== undefined) return cached === UNRESOLVABLE ? undefined : cached;

  const inFlight = pending.get(identifier);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const result = await resolveMiniDoc(identifier);
      actors.set(identifier, result ?? UNRESOLVABLE, { ttl: result ? POSITIVE_TTL : NEGATIVE_TTL });
      if (result && result.did !== identifier) {
        actors.set(result.did, result, { ttl: POSITIVE_TTL });
      }
      return result;
    } finally {
      pending.delete(identifier);
    }
  })();
  pending.set(identifier, promise);
  return promise;
}

export async function resolveActors(
  identifiers: string[],
): Promise<Map<string, ResolvedIdentity | undefined>> {
  const entries = await Promise.all(
    identifiers.map(async (identifier) => [identifier, await resolveActor(identifier)] as const),
  );
  return new Map(entries);
}

export function invalidateActor(did: string, handle?: string): void {
  const previous = actors.get(did);
  const previousHandle = previous !== UNRESOLVABLE ? previous?.handle : undefined;
  actors.delete(did);
  if (handle) actors.delete(handle);
  if (previousHandle && previousHandle !== handle) actors.delete(previousHandle);
}
