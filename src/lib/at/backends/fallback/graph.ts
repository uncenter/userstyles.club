import { parseCanonicalResourceUri, type ActorIdentifier, type Did } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import { resolveActor } from '../../client';
import { getBacklinkedRecords, listRecordsForRepo, type RepoRecord } from '../../records';
import { CLUB_FOLLOW_COLLECTION } from '../../settings';
import { ClubUserstylesAlphaGraphFollow } from '@userstyles.club/atcute';
import type { Follow, FollowView, FollowsPage, RelationshipView } from '../../services/graph';
import { isDid } from '@atcute/lexicons/syntax';

async function resolveDid(actor: ActorIdentifier): Promise<Did> {
  if (isDid(actor)) return actor;
  const resolved = await resolveActor(actor);
  if (!resolved) throw new Error(`could not resolve identity for ${actor}`);
  return resolved.did;
}

function toFollowView(record: RepoRecord<Follow>, did: Did): FollowView {
  return { did, createdAt: record.value.createdAt };
}

/** Directly list an actor's follows from their PDS. */
export async function listFollowsFromPds(actor: ActorIdentifier): Promise<FollowsPage> {
  const records: RepoRecord<Follow>[] = [];
  let cursor: string | undefined;
  do {
    const response = await listRecordsForRepo({
      repo: actor,
      collection: CLUB_FOLLOW_COLLECTION,
      limit: 100,
      cursor,
    });
    records.push(
      ...response.records.filter((r): r is RepoRecord<Follow> =>
        is(ClubUserstylesAlphaGraphFollow.mainSchema, r.value),
      ),
    );
    cursor = response.cursor;
  } while (cursor);

  records.sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));

  return { follows: records.map((r) => toFollowView(r, r.value.subject)) };
}

/** Search for backlinked records toward `actor` via Constellation. */
export async function listFollowersFromConstellation(actor: ActorIdentifier): Promise<FollowsPage> {
  const did = await resolveDid(actor);

  const records = await getBacklinkedRecords({
    subject: did,
    collection: CLUB_FOLLOW_COLLECTION,
    path: 'subject',
  });

  const followers = records
    .filter((r): r is RepoRecord<Follow> => is(ClubUserstylesAlphaGraphFollow.mainSchema, r.value))
    .map((r) => toFollowView(r, parseCanonicalResourceUri(r.uri).repo));

  followers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { follows: followers };
}

export async function getRelationshipFromConstellation(
  actor: Did,
  other: Did,
): Promise<RelationshipView> {
  const [followingRecords, followedByRecords] = await Promise.all([
    getBacklinkedRecords({
      subject: other,
      collection: CLUB_FOLLOW_COLLECTION,
      path: 'subject',
      did: [actor],
    }),
    getBacklinkedRecords({
      subject: actor,
      collection: CLUB_FOLLOW_COLLECTION,
      path: 'subject',
      did: [other],
    }),
  ]);

  return {
    did: other,
    following: followingRecords[0]?.uri,
    followedBy: followedByRecords[0]?.uri,
  };
}

export async function getRelationshipsFromConstellation(
  actor: Did,
  others: Did[],
): Promise<RelationshipView[]> {
  return await Promise.all(others.map((other) => getRelationshipFromConstellation(actor, other)));
}
