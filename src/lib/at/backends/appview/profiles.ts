import { ok } from '@atcute/client';
import type { ActorIdentifier, Did, Handle } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { CLUB_PROFILE_COLLECTION } from '../../settings';
import type { ClubProfile } from '../../services/profiles';

export interface AppviewIdentity {
  did: Did;
  handle: Handle | undefined;
  club: ClubProfile | undefined;
}

function toClubProfile(response: {
  description?: string;
  createdAt?: string;
}): ClubProfile | undefined {
  if (response.createdAt === undefined) return undefined;
  return {
    $type: CLUB_PROFILE_COLLECTION,
    description: response.description,
    createdAt: response.createdAt,
  };
}

export async function getClubProfileFromAppview(actor: ActorIdentifier): Promise<AppviewIdentity> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.actor.getProfile', { params: { actor } }),
  );
  return { did: response.did, handle: response.handle, club: toClubProfile(response) };
}

/** Crayon's batch profile route, capped at 25 actors per request by the lexicon. */
export async function getClubProfilesFromAppview(
  actors: ActorIdentifier[],
): Promise<Map<Did, AppviewIdentity>> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.actor.getProfiles', { params: { actors } }),
  );
  return new Map(
    response.profiles.map((profile) => [
      profile.did,
      { did: profile.did, handle: profile.handle, club: toClubProfile(profile) },
    ]),
  );
}
