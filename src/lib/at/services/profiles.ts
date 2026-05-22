import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { getPublicClient } from '../client';
import { ok } from '@atcute/client';

export async function getProfile(actor: ActorIdentifier) {
  const response = await ok(getPublicClient().get('app.bsky.actor.getProfile', {
    params: { actor }
  }));

  return response;
}

export async function getCachedProfile(actor: Did) {
  const cacheKey = `profile-${actor}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as AppBskyActorDefs.ProfileViewDetailed;
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  const profile = await getProfile(actor);
  localStorage.setItem(cacheKey, JSON.stringify(profile));
  return profile;
}

export function clearCachedProfile(actor: Did) {
  localStorage.removeItem(`profile-${actor}`);
}
