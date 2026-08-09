import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';

import { getPublicClient, resolveToDid } from '../client';
import { getSessionContext } from '../auth';
import { ok } from '@atcute/client';
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
  handle: Handle;
  displayName: string | undefined;
  description: string | undefined;
  avatar: string | undefined;
  club: ClubProfile | undefined;
  bsky: AppBskyActorDefs.ProfileViewDetailed;
};

export function invalidateProfileCaches(did: Did) {
  invalidateCacheEntries(BSKY_CACHE_KEY(did), CLUB_CACHE_KEY(did));
}

function mergeProfileView(
  bsky: AppBskyActorDefs.ProfileViewDetailed,
  club: ClubProfile | undefined,
): ProfileView {
  return {
    did: bsky.did,
    handle: bsky.handle,
    // Bluesky sometimes returns display names as empty strings like "".
    displayName: club?.displayName || (!bsky.displayName?.trim() ? undefined : bsky.displayName),
    description: club?.description || bsky.description,
    avatar: bsky.avatar,
    club,
    bsky,
  };
}

export async function getProfile(actor: ActorIdentifier): Promise<ProfileView> {
  const did = await resolveToDid(actor);
  const [bsky, club] = await Promise.all([getBskyProfile(actor), getClubProfile(did)]);
  return mergeProfileView(bsky, club);
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
  const result = new Map<Did, ProfileView>();
  if (dids.length === 0) return result;

  const misses: Did[] = [];
  for (const did of dids) {
    const cachedBsky = getCacheEntry<AppBskyActorDefs.ProfileViewDetailed>(BSKY_CACHE_KEY(did), BSKY_TTL);
    if (!cachedBsky) {
      misses.push(did);
      continue;
    }
    const cachedClub = getCacheEntry<ClubProfile>(CLUB_CACHE_KEY(did), CLUB_TTL);
    result.set(did, mergeProfileView(cachedBsky, cachedClub ?? undefined));
  }
  if (misses.length === 0) return result;

  for (const batch of chunk(misses, 25)) {
    const [bskyProfiles, clubProfiles] = await Promise.all([
      ok(getPublicClient().get('app.bsky.actor.getProfiles', { params: { actors: batch } })).then(
        (r) => r.profiles,
      ),
      getClubProfilesForDids(batch),
    ]);

    for (const bsky of bskyProfiles) {
      writeCacheEntry(BSKY_CACHE_KEY(bsky.did), bsky);
      const club = clubProfiles.get(bsky.did);
      if (club) writeCacheEntry(CLUB_CACHE_KEY(bsky.did), club);
      result.set(bsky.did, mergeProfileView(bsky, club));
    }
  }

  return result;
}
