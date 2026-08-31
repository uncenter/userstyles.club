import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';

import { getPublicClient, resolveActor } from '../client';
import { getSessionContext } from '../auth';
import { ClientResponseError, ok } from '@atcute/client';
import { putRecord, type RepoRecord } from '../records';
import { getCacheEntryWithTimestamp, writeCacheEntry, invalidateCacheEntries } from '$lib/cache';
import { chunk } from '../utils';

import {
  getClubProfileFromAppview,
  getClubProfilesFromAppview,
  type AppviewIdentity,
} from '../backends/appview/profiles';
import { getClubProfileFromPds, getClubProfilesFromPds } from '../backends/fallback/profiles';

import { makeRecordBuilder } from '../builder';
import { CLUB_PROFILE_COLLECTION, isAppviewEnabled } from '../settings';
import { ClubUserstylesAlphaActorProfile } from '@userstyles.club/atcute';

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000; // (five minutes)

const BSKY_CACHE_KEY = (actor: string) => `profile:bsky:${actor}`;
const CLUB_CACHE_KEY = (actor: string) => `profile:club:${actor}`;

export type ClubProfile = ClubUserstylesAlphaActorProfile.Main;

export type ClubProfileRecord = RepoRecord<ClubProfile>;

/**
 * A merged view of an actor's profile across both Bluesky and userstyles.club.
 */
export type ProfileView = {
  did: Did;
  // Undefined when the handle either fails to resolve or fails verification against the DID document.
  handle: Handle | undefined;
  description: string | undefined;
  avatar: string | undefined;
  club: ClubProfile | undefined;
  bsky: AppBskyActorDefs.ProfileViewDetailed | undefined;
};

export function invalidateProfileCaches(did: Did) {
  invalidateCacheEntries(BSKY_CACHE_KEY(did), CLUB_CACHE_KEY(did));
}

const SELF_RKEY = 'self';
const INVALID_HANDLE = 'handle.invalid';

const BATCH_CHUNK_SIZE = 25;

const builder = makeRecordBuilder(
  ClubUserstylesAlphaActorProfile.mainSchema,
  CLUB_PROFILE_COLLECTION,
);

function normalizeHandle(handle: Handle | undefined): Handle | undefined {
  return handle === INVALID_HANDLE ? undefined : handle;
}

/** A value paired with the time it was produced (so later on callers can prefer fresher cached/fetched sources). */
type Fetched<T> = { data: T; fetchedAt: number };

function writeClubCacheEntry(actor: ActorIdentifier, identity: AppviewIdentity): void {
  writeCacheEntry(CLUB_CACHE_KEY(identity.did), identity);
  if (actor !== identity.did) writeCacheEntry(CLUB_CACHE_KEY(actor), identity);
}

async function getBskyProfileTimestamped(
  actor: ActorIdentifier,
): Promise<Fetched<AppBskyActorDefs.ProfileViewDetailed | undefined>> {
  const cached = getCacheEntryWithTimestamp<AppBskyActorDefs.ProfileViewDetailed>(
    BSKY_CACHE_KEY(actor),
    PROFILE_CACHE_TTL_MS,
  );
  if (cached) return { data: cached.data, fetchedAt: cached.cachedAt };

  try {
    const response = await ok(
      getPublicClient().get('app.bsky.actor.getProfile', { params: { actor } }),
    );
    writeCacheEntry(BSKY_CACHE_KEY(actor), response);
    if (response.did !== actor) writeCacheEntry(BSKY_CACHE_KEY(response.did), response);
    return { data: response, fetchedAt: Date.now() };
  } catch (err) {
    console.warn('bluesky profile fetch failed', err);
    return { data: undefined, fetchedAt: 0 };
  }
}

export async function getBskyProfile(
  actor: ActorIdentifier,
): Promise<AppBskyActorDefs.ProfileViewDetailed | undefined> {
  return (await getBskyProfileTimestamped(actor)).data;
}

async function getBskyProfilesBatch(
  dids: Did[],
): Promise<Map<Did, Fetched<AppBskyActorDefs.ProfileViewDetailed>>> {
  const result = new Map<Did, Fetched<AppBskyActorDefs.ProfileViewDetailed>>();
  const uncached: Did[] = [];

  for (const did of dids) {
    const cached = getCacheEntryWithTimestamp<AppBskyActorDefs.ProfileViewDetailed>(
      BSKY_CACHE_KEY(did),
      PROFILE_CACHE_TTL_MS,
    );
    if (cached) result.set(did, { data: cached.data, fetchedAt: cached.cachedAt });
    else uncached.push(did);
  }

  const client = getPublicClient();
  await Promise.all(
    chunk(uncached, BATCH_CHUNK_SIZE).map(async (batch) => {
      try {
        const response = await ok(
          client.get('app.bsky.actor.getProfiles', { params: { actors: batch } }),
        );
        const fetchedAt = Date.now();
        for (const profile of response.profiles) {
          result.set(profile.did, { data: profile, fetchedAt });
          writeCacheEntry(BSKY_CACHE_KEY(profile.did), profile);
        }
      } catch (err) {
        console.warn('bluesky batch profile fetch failed', err);
      }
    }),
  );

  return result;
}
async function getClubIdentity(actor: ActorIdentifier): Promise<AppviewIdentity | undefined> {
  if (isAppviewEnabled()) {
    try {
      const identity = await getClubProfileFromAppview(actor);
      return { ...identity, handle: normalizeHandle(identity.handle) };
    } catch (err) {
      if (!(err instanceof ClientResponseError && err.error === 'ActorNotFound')) {
        console.warn('crayon appview unavailable, falling back to direct pds fetch', err);
      }
    }
  }
  return await getClubIdentityFromPds(actor);
}

async function getClubIdentityFromPds(
  actor: ActorIdentifier,
): Promise<AppviewIdentity | undefined> {
  const [resolved, record] = await Promise.all([
    resolveActor(actor).catch(() => undefined),
    getClubProfileFromPds(actor),
  ]);
  const did = resolved?.did ?? record?.did;
  if (!did) return undefined;
  return { did, handle: resolved?.handle, club: record?.club };
}

async function getClubIdentityCachedTimestamped(
  actor: ActorIdentifier,
): Promise<Fetched<AppviewIdentity | undefined>> {
  const cached = getCacheEntryWithTimestamp<AppviewIdentity>(
    CLUB_CACHE_KEY(actor),
    PROFILE_CACHE_TTL_MS,
  );
  if (cached) return { data: cached.data, fetchedAt: cached.cachedAt };

  const identity = await getClubIdentity(actor);
  if (identity) writeClubCacheEntry(actor, identity);
  return { data: identity, fetchedAt: Date.now() };
}

async function getClubIdentityCached(actor: ActorIdentifier): Promise<AppviewIdentity | undefined> {
  return (await getClubIdentityCachedTimestamped(actor)).data;
}

async function getClubIdentitiesBatch(dids: Did[]): Promise<Map<Did, Fetched<AppviewIdentity>>> {
  const result = new Map<Did, Fetched<AppviewIdentity>>();
  const uncached: Did[] = [];

  for (const did of dids) {
    const cached = getCacheEntryWithTimestamp<AppviewIdentity>(
      CLUB_CACHE_KEY(did),
      PROFILE_CACHE_TTL_MS,
    );
    if (cached) result.set(did, { data: cached.data, fetchedAt: cached.cachedAt });
    else uncached.push(did);
  }
  if (uncached.length === 0) return result;

  if (!isAppviewEnabled()) {
    const fetched = await getClubIdentitiesFromPdsBatch(uncached);
    const fetchedAt = Date.now();
    for (const [did, identity] of fetched) {
      result.set(did, { data: identity, fetchedAt });
      writeClubCacheEntry(did, identity);
    }
    return result;
  }

  await Promise.all(
    chunk(uncached, BATCH_CHUNK_SIZE).map(async (batch) => {
      try {
        const fetched = await getClubProfilesFromAppview(batch);
        const fetchedAt = Date.now();
        for (const did of batch) {
          const raw = fetched.get(did);
          const identity: AppviewIdentity = raw
            ? { ...raw, handle: normalizeHandle(raw.handle) }
            : { did, handle: undefined, club: undefined };
          result.set(did, { data: identity, fetchedAt });
          writeClubCacheEntry(did, identity);
        }
      } catch (err) {
        console.warn(
          'crayon appview batch profile fetch failed, falling back to direct pds fetch for this batch',
          err,
        );
        const fetched = await getClubIdentitiesFromPdsBatch(batch);
        const fetchedAt = Date.now();
        for (const [did, identity] of fetched) {
          result.set(did, { data: identity, fetchedAt });
          writeClubCacheEntry(did, identity);
        }
      }
    }),
  );

  return result;
}

async function getClubIdentitiesFromPdsBatch(dids: Did[]): Promise<Map<Did, AppviewIdentity>> {
  const [resolvedList, clubByDid] = await Promise.all([
    Promise.all(dids.map((did) => resolveActor(did).catch(() => undefined))),
    getClubProfilesFromPds(dids),
  ]);

  const result = new Map<Did, AppviewIdentity>();
  dids.forEach((did, i) => {
    result.set(did, { did, handle: resolvedList[i]?.handle, club: clubByDid.get(did) });
  });
  return result;
}

const UNFETCHED = 0;

function mergeProfile(
  did: Did,
  bsky: Fetched<AppBskyActorDefs.ProfileViewDetailed | undefined>,
  club: Fetched<AppviewIdentity | undefined>,
): ProfileView {
  // When both appviews have a handle, prefer whichever was fetched most recently rather than favoring one source.
  const bskyHandle = normalizeHandle(bsky.data?.handle);
  const clubHandle = club.data?.handle;
  const handle =
    bskyHandle && clubHandle
      ? bsky.fetchedAt >= club.fetchedAt
        ? bskyHandle
        : clubHandle
      : (bskyHandle ?? clubHandle);

  return {
    did,
    handle,
    description: club.data?.club?.description || bsky.data?.description,
    avatar: bsky.data?.avatar,
    club: club.data?.club,
    bsky: bsky.data,
  };
}

export async function getProfile(actor: ActorIdentifier): Promise<ProfileView> {
  const [bsky, club] = await Promise.all([
    getBskyProfileTimestamped(actor),
    getClubIdentityCachedTimestamped(actor),
  ]);

  const did = club.data?.did ?? bsky.data?.did;
  if (!did) throw new Error(`could not resolve a profile for ${actor}`);

  return mergeProfile(did, bsky, club);
}

export async function getProfiles(dids: Did[]): Promise<Map<Did, ProfileView>> {
  const unique = [...new Set(dids)];
  if (unique.length === 0) return new Map();

  const [bskyByDid, clubByDid] = await Promise.all([
    getBskyProfilesBatch(unique),
    getClubIdentitiesBatch(unique),
  ]);

  const result = new Map<Did, ProfileView>();
  for (const did of unique) {
    const bsky = bskyByDid.get(did) ?? { data: undefined, fetchedAt: UNFETCHED };
    const club = clubByDid.get(did) ?? { data: undefined, fetchedAt: UNFETCHED };
    result.set(did, mergeProfile(did, bsky, club));
  }
  return result;
}

export async function getClubProfile(did: Did): Promise<ClubProfile | undefined> {
  const identity = await getClubIdentityCached(did);
  return identity?.club;
}

export async function setClubProfile(input: { description?: string }, existingCreatedAt?: string) {
  const { did } = getSessionContext('You must be logged in to edit your profile.');

  // No updatedAt, so we use build() instead of update() and generate the createdAt when necessary.
  const record = builder.build({
    ...input,
    createdAt: existingCreatedAt ?? new Date().toISOString(),
  });

  const result = await putRecord(CLUB_PROFILE_COLLECTION, SELF_RKEY, record);

  // Invalidate to refetch handle and Bluesky profile along with the newly written profile next load.
  invalidateCacheEntries(CLUB_CACHE_KEY(did));

  return result;
}
