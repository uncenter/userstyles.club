import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';
import { getPublicClient } from '../client';
import { getSessionContext } from '../auth';
import { ok } from '@atcute/client';
import { getRecord, putRecord, type RepoRecord } from '../records';
import { CLUB_PROFILE_COLLECTION } from '../settings';
import { getCacheEntry, writeCacheEntry, invalidateCacheEntries } from '$lib/cache';

const BSKY_TTL = 5 * 60_000;
const CLUB_TTL = 5 * 60_000;

const BSKY_CACHE_KEY = (actor: string) => `bsky:${actor}`;
const CLUB_CACHE_KEY = (did: Did) => `club:${did}`;

export type ClubProfile = {
  displayName?: string;
  description?: string;
  createdAt?: string;
};

export type ClubProfileRecord = RepoRecord & {
  value: ClubProfile;
};

const SELF_RKEY = 'self';

export async function getClubProfile(did: Did): Promise<ClubProfile | null> {
  const cached = getCacheEntry<ClubProfile>(CLUB_CACHE_KEY(did), CLUB_TTL);
  if (cached) return cached;

  try {
    const response = (await getRecord({
      repo: did,
      collection: CLUB_PROFILE_COLLECTION,
      rkey: SELF_RKEY
    })) as ClubProfileRecord;
    writeCacheEntry(CLUB_CACHE_KEY(did), response.value);
    return response.value;
  } catch {
    return null;
  }
}

export async function setClubProfile(
  displayName: string,
  description: string,
  existingCreatedAt?: string
) {
  const { did } = getSessionContext('You must be logged in to update your profile.');

  const createdAt = existingCreatedAt ?? new Date().toISOString();
  const newProfile: ClubProfile = {
    ...(displayName.trim() && { displayName: displayName.trim() }),
    ...(description.trim() && { description: description.trim() }),
    createdAt
  };

  const result = await putRecord(CLUB_PROFILE_COLLECTION, SELF_RKEY, {
    $type: CLUB_PROFILE_COLLECTION,
    ...newProfile
  });

  writeCacheEntry(CLUB_CACHE_KEY(did), newProfile);
  return result;
}

export async function getBskyProfile(actor: ActorIdentifier) {
  const cached = getCacheEntry<AppBskyActorDefs.ProfileViewDetailed>(
    BSKY_CACHE_KEY(actor),
    BSKY_TTL
  );
  if (cached) return cached;

  const profile = await ok(
    getPublicClient().get('app.bsky.actor.getProfile', { params: { actor } })
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
  club: ClubProfile | null;
  bsky: AppBskyActorDefs.ProfileViewDetailed;
};

export function invalidateProfileCaches(did: Did) {
  invalidateCacheEntries(BSKY_CACHE_KEY(did), CLUB_CACHE_KEY(did));
}

export async function getProfile(actor: ActorIdentifier): Promise<ProfileView> {
  const bsky = await getBskyProfile(actor);
  const club = await getClubProfile(bsky.did);

  return {
    did: bsky.did,
    handle: bsky.handle,
    displayName: club?.displayName || bsky.displayName,
    description: club?.description || bsky.description,
    avatar: bsky.avatar,
    club,
    bsky
  };
}
