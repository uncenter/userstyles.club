import { Client, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import type {} from '@atcute/microcosm';
import { getConstellationUrl, getCrayonUrl, getSlingshotUrl } from './settings';

const ClientCache = new Map<string, Client>();

export interface ResolvedActor {
  did: Did;
  handle: Handle | undefined;
  pds: string;
}

const INVALID_HANDLE = 'handle.invalid';

const POSITIVE_TTL = 24 * 60 * 60_000;
const NEGATIVE_TTL = 60_000;
const MAX_CACHE_ENTRIES = 100;

interface ActorCacheEntry {
  value: ResolvedActor | undefined;
  expiresAt: number;
}

const ActorCache = new Map<ActorIdentifier, ActorCacheEntry>();
const pending = new Map<ActorIdentifier, Promise<ResolvedActor | undefined>>();

function getCachedActor(
  key: ActorIdentifier,
): { hit: true; value: ResolvedActor | undefined } | { hit: false } {
  const entry = ActorCache.get(key);
  if (!entry) return { hit: false };
  if (Date.now() >= entry.expiresAt) {
    ActorCache.delete(key);
    return { hit: false };
  }
  // Mark as recently used by re-inserting this entry to the back.
  ActorCache.delete(key);
  ActorCache.set(key, entry);
  return { hit: true, value: entry.value };
}

function setCachedActor(key: ActorIdentifier, value: ResolvedActor | undefined, ttl: number): void {
  ActorCache.delete(key);
  ActorCache.set(key, { value, expiresAt: Date.now() + ttl });
  if (ActorCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = ActorCache.keys().next().value;
    if (oldestKey !== undefined) ActorCache.delete(oldestKey);
  }
}

/** Resolves a handle or DID to its identity (DID, verified handle, PDS) via Slingshot, cached in-memory with a TTL. */
export async function resolveActor(actor: ActorIdentifier): Promise<ResolvedActor | undefined> {
  const cached = getCachedActor(actor);
  if (cached.hit) return cached.value;

  const inFlight = pending.get(actor);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const response = await getSlingshotClient().get('blue.microcosm.identity.resolveMiniDoc', {
        params: { identifier: actor },
      });
      if (!response.ok) {
        setCachedActor(actor, undefined, NEGATIVE_TTL);
        return undefined;
      }

      const resolved: ResolvedActor = {
        did: response.data.did,
        handle: response.data.handle === INVALID_HANDLE ? undefined : response.data.handle,
        pds: response.data.pds,
      };
      setCachedActor(actor, resolved, POSITIVE_TTL);
      if (resolved.did !== actor) setCachedActor(resolved.did, resolved, POSITIVE_TTL);
      return resolved;
    } finally {
      pending.delete(actor);
    }
  })();
  pending.set(actor, promise);
  return promise;
}

export function getPublicClient(): Client {
  const key = 'public';
  if (ClientCache.has(key)) return ClientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }),
  });
  ClientCache.set(key, client);
  return client;
}

export function getRelayClient(): Client {
  const key = 'relay';
  if (ClientCache.has(key)) return ClientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: 'https://relay1.us-east.bsky.network' }),
  });
  ClientCache.set(key, client);
  return client;
}

export function getConstellationClient(): Client {
  const url = getConstellationUrl();
  const key = `constellation:${url}`;
  if (ClientCache.has(key)) return ClientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: url }) });
  ClientCache.set(key, client);
  return client;
}

export function getSlingshotClient(): Client {
  const url = getSlingshotUrl();
  const key = `slingshot:${url}`;
  if (ClientCache.has(key)) return ClientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: url }) });
  ClientCache.set(key, client);
  return client;
}

export function getCrayonClient(): Client {
  const url = getCrayonUrl();
  const key = `crayon:${url}`;
  if (ClientCache.has(key)) return ClientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: url }) });
  ClientCache.set(key, client);
  return client;
}

export async function getPdsClient(actor: ActorIdentifier): Promise<Client> {
  const resolved = await resolveActor(actor);
  if (!resolved) throw new Error(`could not resolve identity for ${actor}`);

  const key = `pds:${resolved.pds}`;
  if (ClientCache.has(key)) return ClientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: resolved.pds }) });
  ClientCache.set(key, client);
  return client;
}
