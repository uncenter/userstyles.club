import { user } from '../oauth.svelte';
import { getPublicClient } from '../client';
import { getRecord, putRecord } from '../records';
import { getCacheEntry, writeCacheEntry, invalidateCacheEntries } from '$lib/cache';

import { l, type AtIdentifierString, type DatetimeString, type DidString, type HandleString } from '@atproto/lex';
import * as club from '../generated/club'
import * as app from '../generated/app'

const BSKY_TTL = 5 * 60_000;
const CLUB_TTL = 5 * 60_000;

const BSKY_CACHE_KEY = (actor: string) => `bsky:${actor}`;
const CLUB_CACHE_KEY = (did: DidString) => `club:${did}`;

const SELF_RKEY = 'self';

export async function getClubProfile(did: DidString): Promise<club.userstyles.alpha.actor.profile.Main | undefined> {
  const cached = getCacheEntry<club.userstyles.alpha.actor.profile.Main>(CLUB_CACHE_KEY(did), CLUB_TTL);
  if (cached) return cached;

  try {
    const response = await getRecord(club.userstyles.alpha.actor.profile, {
      repo: did,
    });
    writeCacheEntry(CLUB_CACHE_KEY(did), response.value);
    return response.value;
  } catch {
    return undefined;
  }
}

export async function setClubProfile(
  displayName: string,
  description: string,
  existingCreatedAt?: DatetimeString,
) {
  const createdAt = existingCreatedAt ?? l.currentDatetimeString();

  const result = await putRecord(club.userstyles.alpha.actor.profile, {
    displayName: displayName.trim() ? displayName.trim() : undefined,
    description: description.trim() ? description.trim() : undefined,
    createdAt,
  });

  writeCacheEntry(CLUB_CACHE_KEY(user.did!), result.record);
  return result;
}

export async function getBskyProfile(actor: AtIdentifierString) {
  const cached = getCacheEntry<app.bsky.actor.defs.ProfileViewDetailed>(
    BSKY_CACHE_KEY(actor),
    BSKY_TTL,
  );
  if (cached) return cached;

  const client = getPublicClient();
  const profile = await client.call(app.bsky.actor.getProfile, { actor });

  writeCacheEntry(BSKY_CACHE_KEY(actor), profile);
  return profile;
}

export type ProfileView = {
  did: DidString;
  handle: HandleString;
  displayName: string | undefined;
  description: string | undefined;
  avatar: string | undefined;
  club: club.userstyles.alpha.actor.profile.Main | undefined;
  bsky: app.bsky.actor.defs.ProfileViewDetailed;
};

export function invalidateProfileCaches(did: DidString) {
  invalidateCacheEntries(BSKY_CACHE_KEY(did), CLUB_CACHE_KEY(did));
}

export async function getProfile(actor: AtIdentifierString): Promise<ProfileView> {
  const bsky = await getBskyProfile(actor);
  const club = await getClubProfile(bsky.did);

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
