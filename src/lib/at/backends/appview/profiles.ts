import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { CLUB_PROFILE_COLLECTION } from '../../settings';
import type { ClubProfile } from '../../services/profiles';

function toClubProfile(response: { description?: string; createdAt: string }): ClubProfile {
  return {
    $type: CLUB_PROFILE_COLLECTION,
    description: response.description,
    createdAt: response.createdAt,
  };
}

export async function getClubProfileFromAppview(did: Did): Promise<ClubProfile | undefined> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.actor.getProfile', { params: { actor: did } }),
  );
  return toClubProfile(response);
}

/** Crayon's batch profile route, capped at 25 actors per request by the lexicon. */
export async function getClubProfilesFromAppview(dids: Did[]): Promise<Map<Did, ClubProfile>> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.actor.getProfiles', { params: { actors: dids } }),
  );
  return new Map(response.profiles.map((profile) => [profile.did, toClubProfile(profile)]));
}
