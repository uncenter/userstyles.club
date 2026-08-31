import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import { Client, simpleFetchHandler } from '@atcute/client';
import type {} from '@atcute/microcosm';

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

interface CacheEntry {
  value: ResolvedIdentity | undefined;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<ResolvedIdentity | undefined>>();

function getCached(
  key: string,
): { hit: true; value: ResolvedIdentity | undefined } | { hit: false } {
  const entry = cache.get(key);
  if (!entry) return { hit: false };
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return { hit: false };
  }
  // Mark as recently used by re-inserting this entry to the back.
  cache.delete(key);
  cache.set(key, entry);
  return { hit: true, value: entry.value };
}

function setCached(key: string, value: ResolvedIdentity | undefined, ttl: number): void {
  cache.delete(key);
  cache.set(key, { value, expiresAt: Date.now() + ttl });
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
}

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
  const cached = getCached(identifier);
  if (cached.hit) return cached.value;

  const inFlight = pending.get(identifier);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const result = await resolveMiniDoc(identifier);
      setCached(identifier, result, result ? POSITIVE_TTL : NEGATIVE_TTL);
      if (result && result.did !== identifier) setCached(result.did, result, POSITIVE_TTL);
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
  const previousHandle = cache.get(did)?.value?.handle;
  cache.delete(did);
  if (handle) cache.delete(handle);
  if (previousHandle && previousHandle !== handle) cache.delete(previousHandle);
}
