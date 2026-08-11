import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';

import { getPublicClient, getSlingshotClient, resolveToDid } from '../client';
import { getSessionContext } from '../auth';
import { ok, ClientResponseError } from '@atcute/client';
import { putRecord, type RepoRecord } from '../records';
import { getCacheEntry, writeCacheEntry, invalidateCacheEntries } from '$lib/cache';
import { chunk } from '../utils';

import { getClubProfileFromAppview, getClubProfilesFromAppview } from '../backends/appview/profiles';
import { getClubProfileFromPds, getClubProfilesFromPds } from '../backends/fallback/profiles';

import { makeRecordBuilder, type RecordCreateInput } from '../builder';
import { CLUB_PROFILE_COLLECTION, isAppviewEnabled } from '../settings';
import { ClubUserstylesAlphaActorProfile } from '$lib/at/lexicons';

const BSKY_TTL = 5 * 60_000;
const CLUB_TTL = 5 * 60_000;

const BSKY_CACHE_KEY = (actor: string) => `bsky:${actor}`;
const CLUB_CACHE_KEY = (did: Did) => `club:${did}`;

export type ClubProfile = ClubUserstylesAlphaActorProfile.Main;

export type ClubProfileRecord = RepoRecord<ClubProfile>;

const builder = makeRecordBuilder(
  ClubUserstylesAlphaActorProfile.mainSchema,
  CLUB_PROFILE_COLLECTION,
);

const SELF_RKEY = 'self';

export async function getClubProfile(did: Did): Promise<ClubProfile | undefined> {
  const cached = getCacheEntry<ClubProfile>(CLUB_CACHE_KEY(did), CLUB_TTL);
  if (cached) return cached;

  let profile: ClubProfile | undefined;
  if (isAppviewEnabled()) {
    try {
      profile = await getClubProfileFromAppview(did);
    } catch (err) {
      if (err instanceof ClientResponseError && err.error === 'ProfileNotFound') return undefined;
      console.warn('crayon appview unavailable, falling back to direct pds fetch', err);
    }
  }
  profile ??= await getClubProfileFromPds(did);

  if (profile) writeCacheEntry(CLUB_CACHE_KEY(did), profile);
  return profile;
}

export async function setClubProfile(
  input: RecordCreateInput<ClubProfile>,
  existingCreatedAt?: string,
) {
  const { did } = getSessionContext('You must be logged in to update your profile.');

  // No updatedAt, so we use build() instead of update() and generate the createdAt when necessary.
  const newProfile = builder.build({
    ...input,
    createdAt: existingCreatedAt ?? new Date().toISOString(),
  });

  const result = await putRecord(CLUB_PROFILE_COLLECTION, SELF_RKEY, newProfile);
  writeCacheEntry(CLUB_CACHE_KEY(did), newProfile);
  return result;
}

export async function getBskyProfile(actor: ActorIdentifier) {
  const cached = getCacheEntry<AppBskyActorDefs.ProfileViewDetailed>(
    BSKY_CACHE_KEY(actor),
    BSKY_TTL,
  );
  if (cached) return cached;

  const profile = await ok(
    getPublicClient().get('app.bsky.actor.getProfile', { params: { actor } }),
  );
  writeCacheEntry(BSKY_CACHE_KEY(actor), profile);
  return profile;
}

export type ProfileView = {
  did: Did;
  // Undefined when Slingshot could not produce a handle that bidirectionally verified against the DID document -> 'handle.invalid'.
  handle: Handle | undefined;
  description: string | undefined;
  avatar: string | undefined;
  club: ClubProfile | undefined;
  bsky: AppBskyActorDefs.ProfileViewDetailed | undefined;
};

export function invalidateProfileCaches(did: Did) {
  invalidateCacheEntries(BSKY_CACHE_KEY(did), CLUB_CACHE_KEY(did));
}

const INVALID_HANDLE = 'handle.invalid';

/** Bluesky and Slingshot both report a handle that failed bidirectional verification as the
 * literal string 'handle.invalid' rather than omitting it or erroring. */
function normalizeMaybeHandle(handle: Handle | undefined): Handle | undefined {
  return handle === INVALID_HANDLE ? undefined : handle;
}

/** Resolves a handle straight from the DID document via Slingshot, independent of Bluesky's
 * appview — the fallback for actors with no (usable) Bluesky handle to pull one from. Throws if
 * the resolution request itself fails, rather than papering over it with a missing handle. */
async function resolveHandle(did: Did): Promise<Handle | undefined> {
  const doc = await ok(
    getSlingshotClient().get('blue.microcosm.identity.resolveMiniDoc', {
      params: { identifier: did },
    }),
  );
  return normalizeMaybeHandle(doc.handle);
}

async function resolveHandles(dids: Did[]): Promise<Map<Did, Handle | undefined>> {
  const entries = await Promise.all(dids.map(async (did) => [did, await resolveHandle(did)] as const));
  return new Map(entries);
}

function mergeProfileView(
  did: Did,
  handle: Handle | undefined,
  bsky: AppBskyActorDefs.ProfileViewDetailed | undefined,
  club: ClubProfile | undefined,
): ProfileView {
  return {
    did,
    handle,
    description: club?.description || bsky?.description,
    avatar: bsky?.avatar,
    club,
    bsky,
  };
}

export async function getProfile(actor: ActorIdentifier): Promise<ProfileView> {
  const did = await resolveToDid(actor);
  const [bsky, club] = await Promise.all([
    getBskyProfile(actor).catch(() => undefined),
    getClubProfile(did),
  ]);
  // Falls through to Slingshot if Bluesky's response didn't include a handle.
  const handle = normalizeMaybeHandle(bsky?.handle) ?? (await resolveHandle(did));
  return mergeProfileView(did, handle, bsky, club);
}

async function getClubProfilesForDids(dids: Did[]): Promise<Map<Did, ClubProfile>> {
  if (isAppviewEnabled()) {
    try {
      return await getClubProfilesFromAppview(dids);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to per-actor pds fetch', err);
    }
  }
  return await getClubProfilesFromPds(dids);
}

/** Batched, cache-aware profile lookup for rendering lists with mixed authors (avoids one bsky+club round trip per item). */
export async function getProfiles(actors: Did[]): Promise<Map<Did, ProfileView>> {
  const dids = [...new Set(actors)];
  if (dids.length === 0) return new Map();

  const bskyByDid = new Map<Did, AppBskyActorDefs.ProfileViewDetailed | undefined>();
  const clubByDid = new Map<Did, ClubProfile | undefined>();
  const misses: Did[] = [];

  for (const did of dids) {
    const cachedBsky = getCacheEntry<AppBskyActorDefs.ProfileViewDetailed>(BSKY_CACHE_KEY(did), BSKY_TTL);
    if (!cachedBsky) {
      misses.push(did);
      continue;
    }
    bskyByDid.set(did, cachedBsky);
    clubByDid.set(did, getCacheEntry<ClubProfile>(CLUB_CACHE_KEY(did), CLUB_TTL) ?? undefined);
  }

  await Promise.all(
    chunk(misses, 25).map(async (batch) => {
      const [bskyProfiles, clubProfiles] = await Promise.all([
        ok(getPublicClient().get('app.bsky.actor.getProfiles', { params: { actors: batch } }))
          .then((r) => r.profiles)
          .catch(() => [] as AppBskyActorDefs.ProfileViewDetailed[]),
        getClubProfilesForDids(batch),
      ]);
      const fetchedByDid = new Map(bskyProfiles.map((bsky) => [bsky.did, bsky]));

      for (const did of batch) {
        const bsky = fetchedByDid.get(did);
        if (bsky) writeCacheEntry(BSKY_CACHE_KEY(did), bsky);
        bskyByDid.set(did, bsky);

        const club = clubProfiles.get(did);
        if (club) writeCacheEntry(CLUB_CACHE_KEY(did), club);
        clubByDid.set(did, club);
      }
    }),
  );

  // Users/dids that still don't have resolved/verified handles are re-resolved with Slingshot.
  const needsFallback = dids.filter((did) => !normalizeMaybeHandle(bskyByDid.get(did)?.handle));
  const fallbackHandles = needsFallback.length ? await resolveHandles(needsFallback) : undefined;

  const result = new Map<Did, ProfileView>();
  for (const did of dids) {
    const bsky = bskyByDid.get(did);
    const handle = normalizeMaybeHandle(bsky?.handle) ?? fallbackHandles?.get(did);
    result.set(did, mergeProfileView(did, handle, bsky, clubByDid.get(did)));
  }
  return result;
}
