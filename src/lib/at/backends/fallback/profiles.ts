import { type ActorIdentifier, type Did, parseCanonicalResourceUri } from '@atcute/lexicons';

import { getRecord } from '../../records';
import { CLUB_PROFILE_COLLECTION } from '../../settings';
import type { ClubProfile } from '../../services/profiles';

const SELF_RKEY = 'self';

export async function getClubProfileFromPds(
  actor: ActorIdentifier,
): Promise<{ did: Did; club: ClubProfile } | undefined> {
  try {
    const response = await getRecord({
      repo: actor,
      collection: CLUB_PROFILE_COLLECTION,
      rkey: SELF_RKEY,
    });
    const { repo } = parseCanonicalResourceUri(response.uri);
    return { did: repo, club: response.value };
  } catch {
    return undefined;
  }
}

export async function getClubProfilesFromPds(dids: Did[]): Promise<Map<Did, ClubProfile>> {
  const entries = await Promise.all(
    dids.map(async (did) => [did, await getClubProfileFromPds(did)] as const),
  );
  return new Map(
    entries
      .filter((entry): entry is [Did, { did: Did; club: ClubProfile }] => entry[1] !== undefined)
      .map(([did, result]) => [did, result.club]),
  );
}
